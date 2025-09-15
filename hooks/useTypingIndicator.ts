"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface TypingUser {
  user_id: string;
  username: string;
  full_name: string;
}

export function useTypingIndicator(conversationId: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const supabase = createClient();

  // Send typing indicator
  const startTyping = useCallback(async () => {
    if (!conversationId || isTyping) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setIsTyping(true);

    // Send typing presence
    const channel = supabase.channel(`typing:${conversationId}`);
    await channel.subscribe();

    await channel.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: user.id,
        conversation_id: conversationId,
        typing: true,
      },
    });

    // Auto-stop typing after 3 seconds
    setTimeout(async () => {
      if (!conversationId) return;

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) return;

      setIsTyping(false);

      const typingChannel = supabase.channel(`typing:${conversationId}`);
      await typingChannel.send({
        type: "broadcast",
        event: "typing",
        payload: {
          user_id: currentUser.id,
          conversation_id: conversationId,
          typing: false,
        },
      });
    }, 3000);
  }, [conversationId, isTyping, supabase]);

  const stopTyping = useCallback(async () => {
    if (!conversationId || !isTyping) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setIsTyping(false);

    const channel = supabase.channel(`typing:${conversationId}`);
    await channel.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: user.id,
        conversation_id: conversationId,
        typing: false,
      },
    });
  }, [conversationId, isTyping, supabase]);

  // Listen for typing indicators from other users
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on("broadcast", { event: "typing" }, async (payload) => {
        const { user_id, typing } = payload.payload;

        // Get current user to exclude self
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (currentUser && user_id === currentUser.id) return;

        if (typing) {
          // Get user info
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("username, full_name")
            .eq("id", user_id)
            .single();

          if (userProfile) {
            setTypingUsers((prev) => {
              const exists = prev.some((u) => u.user_id === user_id);
              if (exists) return prev;

              return [
                ...prev,
                {
                  user_id,
                  username: userProfile.username,
                  full_name: userProfile.full_name,
                },
              ];
            });

            // Remove typing indicator after 5 seconds of inactivity
            setTimeout(() => {
              setTypingUsers((prev) =>
                prev.filter((u) => u.user_id !== user_id)
              );
            }, 5000);
          }
        } else {
          setTypingUsers((prev) => prev.filter((u) => u.user_id !== user_id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  // Clear typing users when conversation changes
  useEffect(() => {
    setTypingUsers([]);
    setIsTyping(false);
  }, [conversationId]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
}
