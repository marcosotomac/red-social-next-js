"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUserPresence(conversationId: string) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, [supabase]);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel(`presence-${conversationId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = new Set<string>();

        Object.keys(state).forEach((presenceKey) => {
          const presences = state[presenceKey];
          if (presences && presences.length > 0) {
            users.add(presenceKey);
          }
        });

        setOnlineUsers(users);
      })
      .on("presence", { event: "join" }, ({ key }) => {
        setOnlineUsers((prev) => new Set([...prev, key]));
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track user presence
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, supabase]);

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  const getOnlineCount = (): number => {
    return onlineUsers.size;
  };

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    getOnlineCount,
  };
}
