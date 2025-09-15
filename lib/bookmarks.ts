import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function toggleBookmark(
  postId: string,
  currentUserId: string
): Promise<boolean> {
  try {
    console.log("🔖 toggleBookmark called with:", { postId, currentUserId });
    
    // Check if bookmark already exists
    const { data: existingBookmark, error: checkError } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", currentUserId)
      .single();

    console.log("🔖 Existing bookmark check:", { existingBookmark, checkError });

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected if no bookmark exists
      console.error("Error checking bookmark:", checkError);
      throw checkError;
    }

    if (existingBookmark) {
      console.log("🔖 Removing existing bookmark");
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from("bookmarks")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId);

      if (deleteError) {
        console.error("Error removing bookmark:", deleteError);
        throw deleteError;
      }

      console.log("🔖 Bookmark removed successfully");
      return false; // Not bookmarked anymore
    } else {
      console.log("🔖 Adding new bookmark");
      // Add bookmark
      const { error: insertError } = await supabase.from("bookmarks").insert({
        post_id: postId,
        user_id: currentUserId,
      });

      if (insertError) {
        console.error("Error adding bookmark:", insertError);
        throw insertError;
      }

      console.log("🔖 Bookmark added successfully");
      return true; // Now bookmarked
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    throw error;
  }
}

export async function getUserBookmarks(userId: string) {
  try {
    console.log("📚 Getting bookmarks for user:", userId);
    
    const { data, error } = await supabase
      .from("bookmarks")
      .select(
        `
        id,
        created_at,
        post_id,
        posts!inner (
          id,
          content,
          image_url,
          created_at,
          author_id,
          profiles!posts_author_id_fkey (
            username,
            full_name,
            avatar_url
          )
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    console.log("📚 Raw bookmarks data:", { data, error });

    if (error) {
      console.error("Error fetching bookmarks:", error);
      throw error;
    }

    if (!data) return [];

    console.log("📚 Processing", data.length, "bookmarks");

    // Get engagement data for each post
    const postsWithEngagement = await Promise.all(
      data.map(async (bookmark) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const post = (bookmark as any).posts;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const author = (post as any).profiles;
        
        // Get likes count and user like status
        const { count: likesCount } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const { data: userLike } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", userId)
          .maybeSingle();

        // Get comments count
        const { count: commentsCount } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id);

        const processedBookmark = {
          id: bookmark.id,
          created_at: bookmark.created_at,
          post: {
            id: post.id,
            content: post.content,
            image_url: post.image_url,
            created_at: post.created_at,
            author: {
              username: author.username,
              full_name: author.full_name,
              avatar_url: author.avatar_url,
            },
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            user_has_liked: !!userLike,
            user_has_bookmarked: true,
          },
        };

        console.log("📚 Processed bookmark:", processedBookmark.post.id);
        return processedBookmark;
      })
    );

    console.log("📚 Returning", postsWithEngagement.length, "processed bookmarks");
    return postsWithEngagement;
  } catch (error) {
    console.error("Error getting user bookmarks:", error);
    throw error;
  }
}

export async function getBookmarkCount(postId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (error) {
      console.error("Error getting bookmark count:", error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error("Error getting bookmark count:", error);
    throw error;
  }
}
