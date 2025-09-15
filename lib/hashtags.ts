import { createClient } from "@/lib/supabase/client";
import { extractHashtags, extractMentions } from "@/lib/text-parser";

/**
 * Process hashtags and mentions for a post
 */
export async function processPostContent(
  postId: string,
  content: string,
  authorId: string
) {
  const supabase = createClient();

  try {
    // Extract hashtags and mentions
    const hashtags = extractHashtags(content);
    const mentions = extractMentions(content);

    // Process hashtags
    for (const hashtagName of hashtags) {
      // Get or create hashtag
      let { data: hashtag, error } = await supabase
        .from("hashtags")
        .select("id")
        .eq("name", hashtagName)
        .single();

      if (error && error.code === "PGRST116") {
        // Hashtag doesn't exist, create it
        const { data: newHashtag, error: createError } = await supabase
          .from("hashtags")
          .insert({ name: hashtagName })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating hashtag:", createError);
          continue;
        }
        hashtag = newHashtag;
      } else if (error) {
        console.error("Error fetching hashtag:", error);
        continue;
      }

      if (hashtag) {
        // Link hashtag to post
        const { error: linkError } = await supabase
          .from("post_hashtags")
          .insert({
            post_id: postId,
            hashtag_id: hashtag.id,
          });

        if (linkError && linkError.code !== "23505") {
          // Ignore unique constraint violations (already linked)
          console.error("Error linking hashtag to post:", linkError);
        }
      }
    }

    // Process mentions
    for (const username of mentions) {
      // Find the mentioned user
      const { data: mentionedUser, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      if (userError) {
        console.log(`User @${username} not found, skipping mention`);
        continue;
      }

      if (mentionedUser) {
        // Create mention record
        const { error: mentionError } = await supabase.from("mentions").insert({
          post_id: postId,
          mentioned_user_id: mentionedUser.id,
          mentioning_user_id: authorId,
        });

        if (mentionError && mentionError.code !== "23505") {
          // Ignore unique constraint violations (already mentioned)
          console.error("Error creating mention:", mentionError);
        }
      }
    }

    console.log(
      `Processed ${hashtags.length} hashtags and ${mentions.length} mentions for post ${postId}`
    );
  } catch (error) {
    console.error("Error processing post content:", error);
  }
}

/**
 * Get hashtags for a post
 */
export async function getPostHashtags(postId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("post_hashtags")
    .select(
      `
      hashtag_id,
      hashtags (
        name,
        post_count
      )
    `
    )
    .eq("post_id", postId);

  if (error) {
    console.error("Error fetching post hashtags:", error);
    return [];
  }

  return data?.map((item) => item.hashtags) || [];
}

/**
 * Get mentions for a post
 */
export async function getPostMentions(postId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("mentions")
    .select(
      `
      mentioned_user_id,
      profiles!mentions_mentioned_user_id_fkey (
        username,
        full_name,
        avatar_url
      )
    `
    )
    .eq("post_id", postId);

  if (error) {
    console.error("Error fetching post mentions:", error);
    return [];
  }

  return data?.map((item) => item.profiles) || [];
}

/**
 * Search hashtags
 */
export async function searchHashtags(query: string, limit = 10) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("hashtags")
    .select("name, post_count")
    .ilike("name", `%${query}%`)
    .order("post_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error searching hashtags:", error);
    return [];
  }

  return data || [];
}

/**
 * Get trending hashtags
 */
export async function getTrendingHashtags(limit = 10) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("hashtags")
    .select("name, post_count")
    .order("post_count", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching trending hashtags:", error);
    return [];
  }

  return data || [];
}

/**
 * Get posts by hashtag
 */
export async function getPostsByHashtag(hashtagName: string, limit = 20) {
  const supabase = createClient();

  // First get the hashtag ID
  const { data: hashtagData, error: hashtagError } = await supabase
    .from("hashtags")
    .select("id")
    .eq("name", hashtagName)
    .single();

  if (hashtagError || !hashtagData) {
    console.error("Error finding hashtag:", hashtagError);
    return [];
  }

  const { data, error } = await supabase
    .from("post_hashtags")
    .select(
      `
      posts (
        id,
        content,
        image_url,
        created_at,
        profiles!posts_author_id_fkey (
          username,
          full_name,
          avatar_url
        )
      )
    `
    )
    .eq("hashtag_id", hashtagData.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching posts by hashtag:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    data
      ?.map((item: { posts: any }) => {
        const post = item.posts;
        if (!post) return null;

        return {
          id: post.id,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          author: post.profiles,
        };
      })
      .filter((post) => post !== null) || []
  );
}

/**
 * Repair hashtag post counts by recalculating from actual post_hashtags relationships
 */
export async function repairHashtagCounts() {
  const supabase = createClient();

  try {
    const { error } = await supabase.rpc("repair_hashtag_counts");

    if (error) {
      console.error("Error repairing hashtag counts:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in repairHashtagCounts:", error);
    return { success: false, error: "Failed to repair hashtag counts" };
  }
}
