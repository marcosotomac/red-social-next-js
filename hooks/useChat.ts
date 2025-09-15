"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Message,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
} from "@/lib/chat";

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getConversationMessages(conversationId);
      if (result.success && result.messages) {
        setMessages(result.messages);
      } else {
        setError(result.error || "Failed to load messages");
      }
    } catch (err) {
      console.error("Error loading messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Send a new message
  const handleSendMessage = useCallback(
    async (
      content: string,
      messageType: "text" | "image" | "file" = "text",
      fileUrl?: string
    ) => {
      if (!conversationId || !content.trim()) return;

      setSendingMessage(true);
      setError(null);

      try {
        const result = await sendMessage(
          conversationId,
          content,
          messageType,
          fileUrl
        );
        if (result.success && result.message) {
          // Message will be added via realtime subscription
          // But we can optimistically add it for better UX
          setMessages((prev) => [...prev, result.message!]);
        } else {
          setError(result.error || "Failed to send message");
        }
      } catch (err) {
        console.error("Error sending message:", err);
        setError("Failed to send message");
      } finally {
        setSendingMessage(false);
      }
    },
    [conversationId]
  );

  // Mark messages as read
  const handleMarkAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await markMessagesAsRead(conversationId);
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  }, [conversationId]);

  // Set up realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log("New message received:", payload.new);

          // Fetch the complete message with sender info
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

          if (newMessage && !newMessage.is_deleted) {
            setMessages((prev) => {
              // Check if message already exists (avoid duplicates)
              const messageExists = prev.some(
                (msg) => msg.id === newMessage.id
              );
              if (messageExists) return prev;

              return [...prev, newMessage as Message];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("Message updated:", payload.new);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("Message deleted:", payload.old);

          setMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  // Load messages when conversation changes
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Mark messages as read when conversation is viewed
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      handleMarkAsRead();
    }
  }, [conversationId, messages.length, handleMarkAsRead]);

  return {
    messages,
    loading,
    sendingMessage,
    error,
    sendMessage: handleSendMessage,
    markAsRead: handleMarkAsRead,
    refreshMessages: loadMessages,
  };
}
