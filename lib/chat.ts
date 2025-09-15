import { createClient } from "@/lib/supabase/client";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "image" | "file";
  file_url?: string;
  created_at: string;
  edited_at?: string;
  is_deleted: boolean;
  sender: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  is_read?: boolean;
}

export interface Conversation {
  id: string;
  title?: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  user: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

/**
 * Create a new conversation between users
 */
export async function createConversation(
  participantUserIds: string[],
  title?: string,
  isGroup = false
): Promise<{ success: boolean; conversation?: Conversation; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // For direct messages, check if conversation already exists
    if (!isGroup && participantUserIds.length === 1) {
      const existingConversation = await findDirectConversation(
        user.id,
        participantUserIds[0]
      );
      if (existingConversation.success && existingConversation.conversation) {
        return existingConversation;
      }
    }

    // Create conversation
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        title,
        is_group: isGroup,
        created_by: user.id,
      })
      .select()
      .single();

    if (conversationError) {
      console.error("Error creating conversation:", conversationError);
      return { success: false, error: conversationError.message };
    }

    // Add creator as participant
    const allParticipants = [user.id, ...participantUserIds];
    const participantsData = allParticipants.map((userId) => ({
      conversation_id: conversation.id,
      user_id: userId,
    }));

    const { error: participantsError } = await supabase
      .from("conversation_participants")
      .insert(participantsData);

    if (participantsError) {
      console.error("Error adding participants:", participantsError);
      // Clean up conversation if participants failed
      await supabase.from("conversations").delete().eq("id", conversation.id);
      return { success: false, error: participantsError.message };
    }

    // Fetch the complete conversation data
    const fullConversation = await getConversationById(conversation.id);
    if (fullConversation.success && fullConversation.conversation) {
      return fullConversation;
    }

    return { success: true, conversation: conversation as Conversation };
  } catch (error) {
    console.error("Error in createConversation:", error);
    return { success: false, error: "Failed to create conversation" };
  }
}

/**
 * Find existing direct conversation between two users
 */
export async function findDirectConversation(
  userId1: string,
  userId2: string
): Promise<{ success: boolean; conversation?: Conversation; error?: string }> {
  try {
    const supabase = createClient();

    // Find conversations that have exactly these two participants
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        conversation_participants!inner (
          user_id,
          user:profiles!conversation_participants_user_id_fkey (
            username,
            full_name,
            avatar_url
          )
        )
      `
      )
      .eq("is_group", false);

    if (error) {
      console.error("Error finding direct conversation:", error);
      return { success: false, error: error.message };
    }

    // Filter to find conversation with exactly these two users
    const directConversation = conversations?.find((conv) => {
      const participantIds = conv.conversation_participants.map(
        (p: ConversationParticipant) => p.user_id
      );
      return (
        participantIds.length === 2 &&
        participantIds.includes(userId1) &&
        participantIds.includes(userId2)
      );
    });

    if (directConversation) {
      const fullConversation = await getConversationById(directConversation.id);
      return fullConversation;
    }

    return { success: true }; // No existing conversation found
  } catch (error) {
    console.error("Error in findDirectConversation:", error);
    return { success: false, error: "Failed to find conversation" };
  }
}

/**
 * Send a message to a conversation
 */
export async function sendMessage(
  conversationId: string,
  content: string,
  messageType: "text" | "image" | "file" = "text",
  fileUrl?: string
): Promise<{ success: boolean; message?: Message; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Verify user is participant in conversation
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (!participant) {
      return { success: false, error: "User not authorized to send message" };
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        message_type: messageType,
        file_url: fileUrl,
      })
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
      .single();

    if (messageError) {
      console.error("Error sending message:", messageError);
      return { success: false, error: messageError.message };
    }

    return { success: true, message: message as Message };
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return { success: false, error: "Failed to send message" };
  }
}

/**
 * Get user's conversations
 */
export async function getUserConversations(): Promise<{
  success: boolean;
  conversations?: Conversation[];
  error?: string;
}> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // First, get conversation IDs where user is a participant (avoiding RLS recursion)
    const { data: participantData, error: participantError } = await supabase
      .from("conversation_participants")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);

    if (participantError) {
      console.error("Error fetching participant data:", participantError);
      return { success: false, error: participantError.message };
    }

    if (!participantData || participantData.length === 0) {
      return { success: true, conversations: [] };
    }

    const conversationIds = participantData.map((p) => p.conversation_id);
    const participantMap = Object.fromEntries(
      participantData.map((p) => [p.conversation_id, p.last_read_at])
    );

    // Get conversations by IDs (direct query, no joins)
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("*")
      .in("id", conversationIds)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return { success: false, error: error.message };
    }

    // Get additional data for each conversation separately
    const conversationsWithDetails = await Promise.all(
      conversations?.map(async (conv) => {
        // Get participants
        const { data: participantData } = await supabase
          .from("conversation_participants")
          .select("user_id, last_read_at")
          .eq("conversation_id", conv.id);

        // Get user details for participants separately
        const participants = [];
        if (participantData) {
          for (const participant of participantData) {
            const { data: userData } = await supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url")
              .eq("id", participant.user_id)
              .single();

            if (userData) {
              participants.push({
                user_id: participant.user_id,
                last_read_at: participant.last_read_at,
                user: userData,
              });
            }
          }
        }

        // Get last message
        const { data: lastMessageData } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        let lastMessage = null;
        if (lastMessageData) {
          // Get sender details separately
          const { data: senderData } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .eq("id", lastMessageData.sender_id)
            .single();

          lastMessage = {
            ...lastMessageData,
            sender: senderData,
          };
        }

        // Count unread messages
        const lastReadAt = participantMap[conv.id];
        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_deleted", false)
          .gt("created_at", lastReadAt || "1970-01-01");

        return {
          ...conv,
          participants: participants || [],
          last_message: lastMessage,
          unread_count: unreadCount || 0,
        };
      }) || []
    );

    return {
      success: true,
      conversations: conversationsWithDetails as Conversation[],
    };
  } catch (error) {
    console.error("Error in getUserConversations:", error);
    return { success: false, error: "Failed to fetch conversations" };
  }
}

/**
 * Get conversation by ID
 */
export async function getConversationById(
  conversationId: string
): Promise<{ success: boolean; conversation?: Conversation; error?: string }> {
  try {
    const supabase = createClient();

    const { data: conversation, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        conversation_participants (
          *,
          user:profiles!conversation_participants_user_id_fkey (
            username,
            full_name,
            avatar_url
          )
        )
      `
      )
      .eq("id", conversationId)
      .single();

    if (error) {
      console.error("Error fetching conversation:", error);
      return { success: false, error: error.message };
    }

    return { success: true, conversation: conversation as Conversation };
  } catch (error) {
    console.error("Error in getConversationById:", error);
    return { success: false, error: "Failed to fetch conversation" };
  }
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  offset = 0
): Promise<{ success: boolean; messages?: Message[]; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Verify user is participant
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (!participant) {
      return { success: false, error: "User not authorized to view messages" };
    }

    const { data: messages, error } = await supabase
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
      .eq("conversation_id", conversationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching messages:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      messages: (messages?.reverse() || []) as Message[],
    };
  } catch (error) {
    console.error("Error in getConversationMessages:", error);
    return { success: false, error: "Failed to fetch messages" };
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Update participant's last_read_at
    const { error } = await supabase
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error marking messages as read:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error);
    return { success: false, error: "Failed to mark messages as read" };
  }
}

/**
 * Search users to start conversations with
 */
export async function searchUsers(
  query: string,
  limit = 10
): Promise<{ success: boolean; users?: User[]; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .neq("id", user.id) // Exclude current user
      .limit(limit);

    if (error) {
      console.error("Error searching users:", error);
      return { success: false, error: error.message };
    }

    return { success: true, users: users || [] };
  } catch (error) {
    console.error("Error in searchUsers:", error);
    return { success: false, error: "Failed to search users" };
  }
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("messages")
      .update({ is_deleted: true })
      .eq("id", messageId)
      .eq("sender_id", user.id);

    if (error) {
      console.error("Error deleting message:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteMessage:", error);
    return { success: false, error: "Failed to delete message" };
  }
}
