"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ChatStats {
  totalConversations: number;
  totalMessages: number;
  unreadCount: number;
  activeChats: number;
}

export function useChatStats() {
  const [stats, setStats] = useState<ChatStats>({
    totalConversations: 0,
    totalMessages: 0,
    unreadCount: 0,
    activeChats: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get conversation count
        const { count: conversationCount } = await supabase
          .from("conversation_participants")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Get message count for user's conversations
        const { count: messageCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("sender_id", user.id);

        // Get unread count
        const { count: unreadCount } = await supabase
          .from("message_read_status")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        setStats({
          totalConversations: conversationCount || 0,
          totalMessages: messageCount || 0,
          unreadCount: unreadCount || 0,
          activeChats: 0, // Will be calculated with presence data
        });
      } catch (error) {
        console.error("Error fetching chat stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  return { stats, loading };
}
