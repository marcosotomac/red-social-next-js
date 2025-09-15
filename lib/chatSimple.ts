"use client";

import { createClient } from "@/lib/supabase/client";

interface BasicConversation {
  id: string;
  title?: string;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export async function getUserConversationsSimple(): Promise<
  BasicConversation[]
> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    // Get conversation IDs where user participates (simple query)
    const { data: participantData, error: participantError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (participantError) {
      console.error("Error fetching participants:", participantError);
      return [];
    }

    if (!participantData || participantData.length === 0) {
      return [];
    }

    const conversationIds = participantData.map((p) => p.conversation_id);

    // Get conversations (simple query, no joins)
    const { data: conversations, error: conversationError } = await supabase
      .from("conversations")
      .select("id, title, is_group, created_at, updated_at, created_by")
      .in("id", conversationIds)
      .order("updated_at", { ascending: false });

    if (conversationError) {
      console.error("Error fetching conversations:", conversationError);
      return [];
    }

    return conversations || [];
  } catch (error) {
    console.error("Error in getUserConversationsSimple:", error);
    return [];
  }
}
