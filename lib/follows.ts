import { createClient } from "@/lib/supabase/client";

export interface FollowStatus {
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export interface ToggleFollowResult {
  success: boolean;
  is_following: boolean;
  followers_count: number;
  action?: string;
  error?: string;
}

/**
 * Get follow status and counts for a user profile
 */
export async function getFollowStatus(
  currentUserId: string | null,
  profileUserId: string
): Promise<FollowStatus | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_follow_status", {
    current_user_id: currentUserId,
    profile_user_id: profileUserId,
  });

  if (error) {
    console.error("Error getting follow status:", error);
    return null;
  }

  return data as FollowStatus;
}

/**
 * Toggle follow status for a user
 */
export async function toggleFollow(
  followerId: string,
  followingId: string
): Promise<ToggleFollowResult | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("toggle_follow", {
    follower_user_id: followerId,
    following_user_id: followingId,
  });

  if (error) {
    console.error("Error toggling follow:", error);
    return null;
  }

  return data as ToggleFollowResult;
}

/**
 * Subscribe to follow changes for real-time updates
 */
export function subscribeToFollowChanges(
  profileUserId: string,
  onFollowChange: (data: { [key: string]: unknown }) => void
) {
  const supabase = createClient();

  const subscription = supabase
    .channel(`follows:${profileUserId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "follows",
        filter: `following_id=eq.${profileUserId}`,
      },
      onFollowChange
    )
    .subscribe();

  return subscription;
}
