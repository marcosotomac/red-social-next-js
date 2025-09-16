import { createClient } from "@/lib/supabase/client";

export interface UserStats {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
}

/**
 * Get statistics for multiple users efficiently
 */
export async function getUsersStats(userIds: string[]): Promise<UserStats[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_user_stats", {
    user_ids: userIds,
  });

  if (error) {
    console.error("Error getting users stats:", error);
    return [];
  }

  return (data || []).map((user: {
    user_id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    followers_count: number;
    following_count: number;
    posts_count: number;
  }) => ({
    user_id: user.user_id,
    username: user.username,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    followers_count: Number(user.followers_count),
    following_count: Number(user.following_count),
    posts_count: Number(user.posts_count),
  }));
}

/**
 * Get statistics for a single user
 */
export async function getSingleUserStats(userId: string): Promise<UserStats | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_single_user_stats", {
    target_user_id: userId,
  });

  if (error) {
    console.error("Error getting user stats:", error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const user = data[0];
  return {
    user_id: user.user_id,
    username: user.username,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    followers_count: Number(user.followers_count),
    following_count: Number(user.following_count),
    posts_count: Number(user.posts_count),
  };
}