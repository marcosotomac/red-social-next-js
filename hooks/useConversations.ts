"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Conversation,
  getUserConversations,
  createConversation,
  searchUsers,
  User,
} from "@/lib/chat";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const supabase = createClient();

  // Load user's conversations
  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getUserConversations();
      if (result.success && result.conversations) {
        setConversations(result.conversations);

        // Calculate total unread count
        const totalUnread = result.conversations.reduce(
          (sum, conv) => sum + (conv.unread_count || 0),
          0
        );
        setTotalUnreadCount(totalUnread);
      } else {
        console.error("Failed to load conversations:", result.error);
        setError(result.error || "Failed to load conversations");
        // Set empty array on error to prevent infinite loading
        setConversations([]);
        setTotalUnreadCount(0);
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError("Error loading conversations");
      // Set empty array on error
      setConversations([]);
      setTotalUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new conversation
  const handleCreateConversation = useCallback(
    async (participantUserIds: string[], title?: string, isGroup = false) => {
      try {
        const result = await createConversation(
          participantUserIds,
          title,
          isGroup
        );
        if (result.success && result.conversation) {
          // Refresh conversations to include the new one
          await loadConversations();
          return result.conversation;
        } else {
          setError(result.error || "Failed to create conversation");
          return null;
        }
      } catch (err) {
        console.error("Error creating conversation:", err);
        setError("Failed to create conversation");
        return null;
      }
    },
    [loadConversations]
  );

  // Set up realtime subscription for conversation updates
  useEffect(() => {
    let currentUserId: string | null = null;

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      currentUserId = user?.id || null;
    });

    // Subscribe to conversations where user is a participant
    const conversationsChannel = supabase
      .channel("user-conversations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          console.log("New conversation:", payload.new);
          // Refresh conversations to get complete data
          loadConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          console.log("Conversation updated:", payload.new);

          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === payload.new.id ? { ...conv, ...payload.new } : conv
            )
          );
        }
      )
      .subscribe();

    // Subscribe to new messages to update last_message and unread counts
    const messagesChannel = supabase
      .channel("user-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          console.log("New message in conversation:", payload.new);

          // Get the complete message with sender info
          const { data: newMessage } = await supabase
            .from("messages")
            .select(
              `
              *,
              sender:profiles!messages_sender_id_fkey (
                username,
                full_name,
                avatar_url
              )
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            // Show browser notification for new messages (only if not sent by current user)
            if (currentUserId && newMessage.sender_id !== currentUserId) {
              // Show notification if page is not visible
              if (
                document.hidden &&
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification(
                  `Nuevo mensaje de ${newMessage.sender.full_name}`,
                  {
                    body:
                      newMessage.content.length > 50
                        ? newMessage.content.substring(0, 50) + "..."
                        : newMessage.content,
                    icon: newMessage.sender.avatar_url || "/favicon.ico",
                    tag: "new-message",
                  }
                );
              }
            }

            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id === newMessage.conversation_id) {
                  return {
                    ...conv,
                    last_message: newMessage,
                    updated_at: newMessage.created_at,
                    unread_count: conv.unread_count + 1,
                  };
                }
                return conv;
              })
            );

            // Update total unread count
            setTotalUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    // Subscribe to participant updates (to know when messages are read)
    const participantsChannel = supabase
      .channel("conversation-participants")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
        },
        (payload) => {
          console.log("Participant updated:", payload.new);

          // If current user's last_read_at was updated, refresh conversations
          // to get updated unread counts
          if (currentUserId && payload.new.user_id === currentUserId) {
            loadConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(participantsChannel);
    };
  }, [supabase, loadConversations]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    loading,
    error,
    totalUnreadCount,
    createConversation: handleCreateConversation,
    refreshConversations: loadConversations,
  };
}

// Hook for searching users
export function useUserSearch() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchForUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await searchUsers(query);
      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        setError(result.error || "Failed to search users");
        setUsers([]);
      }
    } catch (err) {
      console.error("Error searching users:", err);
      setError("Failed to search users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setUsers([]);
    setError(null);
  }, []);

  return {
    users,
    loading,
    error,
    searchUsers: searchForUsers,
    clearSearch,
  };
}
