"use client";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// Temporary interface for raw story data from Supabase
interface RawStory {
  id: string;
  author_id: string;
  content: string | null;
  media_url: string;
  media_type: "image" | "video";
  duration: number;
  background_color: string;
  created_at: string;
  expires_at: string;
  is_highlight: boolean;
  highlight_title: string | null;
  views_count: number;
  likes_count: number;
  author: unknown; // This can be array or object from Supabase
}

export interface Story {
  id: string;
  author_id: string;
  content: string | null;
  media_url: string;
  media_type: "image" | "video";
  duration: number;
  background_color: string;
  created_at: string;
  expires_at: string;
  is_highlight: boolean;
  highlight_title: string | null;
  views_count: number;
  likes_count: number;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  user_has_viewed?: boolean;
  user_has_liked?: boolean;
}

export interface StoryGroup {
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  stories: Story[];
  latest_story: string; // ISO date string
  has_unviewed: boolean;
}

// Helper function to normalize author data
function normalizeAuthor(author: unknown) {
  return Array.isArray(author) ? author[0] : author;
}

// Helper function to convert RawStory to Story
function normalizeStory(
  rawStory: RawStory,
  userViews: string[] = [],
  userLikes: string[] = []
): Story {
  return {
    ...rawStory,
    author: normalizeAuthor(rawStory.author),
    user_has_viewed: userViews.includes(rawStory.id),
    user_has_liked: userLikes.includes(rawStory.id),
  };
}

/**
 * Get all active stories grouped by author
 */
export async function getStoriesGroupedByAuthor(
  userId?: string
): Promise<StoryGroup[]> {
  try {
    const now = new Date().toISOString();

    // Base query to get stories with author info
    const { data: stories, error } = await supabase
      .from("stories")
      .select(
        `
        id,
        author_id,
        content,
        media_url,
        media_type,
        duration,
        background_color,
        created_at,
        expires_at,
        is_highlight,
        highlight_title,
        views_count,
        likes_count,
        author:profiles!stories_author_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .or(`expires_at.gt.${now},is_highlight.eq.true`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stories:", error);
      return [];
    }

    if (!stories || stories.length === 0) {
      return [];
    }

    // If user is provided, get their views and likes
    let userViews: string[] = [];
    let userLikes: string[] = [];

    if (userId) {
      // Get user's viewed stories
      const { data: views } = await supabase
        .from("story_views")
        .select("story_id")
        .eq("viewer_id", userId);

      userViews = views?.map((v) => v.story_id) || [];

      // Get user's liked stories
      const { data: likes } = await supabase
        .from("story_likes")
        .select("story_id")
        .eq("user_id", userId);

      userLikes = likes?.map((l) => l.story_id) || [];
    }

    // Group stories by author
    const storyGroups = new Map<string, StoryGroup>();

    stories.forEach((rawStory: RawStory) => {
      const authorId = rawStory.author_id;
      const storyWithUserData = normalizeStory(rawStory, userViews, userLikes);

      if (!storyGroups.has(authorId)) {
        storyGroups.set(authorId, {
          author: storyWithUserData.author,
          stories: [],
          latest_story: rawStory.created_at,
          has_unviewed: false,
        });
      }

      const group = storyGroups.get(authorId)!;
      group.stories.push(storyWithUserData);

      // Update latest story time
      if (new Date(rawStory.created_at) > new Date(group.latest_story)) {
        group.latest_story = rawStory.created_at;
      }

      // Check if there are unviewed stories
      if (!storyWithUserData.user_has_viewed) {
        group.has_unviewed = true;
      }
    });

    // Convert map to array and sort by latest story
    return Array.from(storyGroups.values()).sort(
      (a, b) =>
        new Date(b.latest_story).getTime() - new Date(a.latest_story).getTime()
    );
  } catch (error) {
    console.error("Error in getStoriesGroupedByAuthor:", error);
    return [];
  }
}

/**
 * Get stories by specific author
 */
export async function getStoriesByAuthor(
  authorId: string,
  userId?: string
): Promise<Story[]> {
  try {
    const now = new Date().toISOString();

    const { data: stories, error } = await supabase
      .from("stories")
      .select(
        `
        id,
        author_id,
        content,
        media_url,
        media_type,
        duration,
        background_color,
        created_at,
        expires_at,
        is_highlight,
        highlight_title,
        views_count,
        likes_count,
        author:profiles!stories_author_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .eq("author_id", authorId)
      .or(`expires_at.gt.${now},is_highlight.eq.true`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching stories by author:", error);
      return [];
    }

    if (!stories || !userId) {
      return (stories || []).map((rawStory: RawStory) =>
        normalizeStory(rawStory)
      );
    }

    // Get user's views and likes for these stories
    const storyIds = stories.map((s) => s.id);

    const [{ data: views }, { data: likes }] = await Promise.all([
      supabase
        .from("story_views")
        .select("story_id")
        .eq("viewer_id", userId)
        .in("story_id", storyIds),
      supabase
        .from("story_likes")
        .select("story_id")
        .eq("user_id", userId)
        .in("story_id", storyIds),
    ]);

    const userViews = views?.map((v) => v.story_id) || [];
    const userLikes = likes?.map((l) => l.story_id) || [];

    return stories.map((rawStory: RawStory) =>
      normalizeStory(rawStory, userViews, userLikes)
    );
  } catch (error) {
    console.error("Error in getStoriesByAuthor:", error);
    return [];
  }
}

/**
 * Create a new story
 */
export async function createStory(data: {
  content?: string;
  media_url: string;
  media_type: "image" | "video";
  duration?: number;
  background_color?: string;
}): Promise<{ success: boolean; story?: Story; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const storyData = {
      author_id: user.id,
      content: data.content || null,
      media_url: data.media_url,
      media_type: data.media_type,
      duration: data.duration || (data.media_type === "image" ? 15 : 30),
      background_color: data.background_color || "#000000",
    };

    const { data: story, error } = await supabase
      .from("stories")
      .insert([storyData])
      .select(
        `
        *,
        author:profiles!stories_author_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      console.error("Error creating story:", error);
      return { success: false, error: error.message };
    }

    return { success: true, story: story as Story };
  } catch (error) {
    console.error("Error in createStory:", error);
    return { success: false, error: "Failed to create story" };
  }
}

/**
 * Mark a story as viewed by current user
 */
export async function markStoryAsViewed(
  storyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Use upsert to avoid duplicate view entries
    const { error } = await supabase
      .from("story_views")
      .upsert(
        { story_id: storyId, viewer_id: user.id },
        { onConflict: "story_id,viewer_id" }
      );

    if (error) {
      console.error("Error marking story as viewed:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in markStoryAsViewed:", error);
    return { success: false, error: "Failed to mark story as viewed" };
  }
}

/**
 * Toggle like on a story
 */
export async function toggleStoryLike(
  storyId: string
): Promise<{ success: boolean; isLiked: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        isLiked: false,
        error: "User not authenticated",
      };
    }

    // Check if user already liked this story
    const { data: existingLike } = await supabase
      .from("story_likes")
      .select("id")
      .eq("story_id", storyId)
      .eq("user_id", user.id)
      .single();

    if (existingLike) {
      // Remove like
      const { error } = await supabase
        .from("story_likes")
        .delete()
        .eq("story_id", storyId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error removing story like:", error);
        return { success: false, isLiked: true, error: error.message };
      }

      return { success: true, isLiked: false };
    } else {
      // Add like
      const { error } = await supabase
        .from("story_likes")
        .insert([{ story_id: storyId, user_id: user.id }]);

      if (error) {
        console.error("Error adding story like:", error);
        return { success: false, isLiked: false, error: error.message };
      }

      return { success: true, isLiked: true };
    }
  } catch (error) {
    console.error("Error in toggleStoryLike:", error);
    return {
      success: false,
      isLiked: false,
      error: "Failed to toggle story like",
    };
  }
}

/**
 * Delete a story (only author can delete)
 */
export async function deleteStory(
  storyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("stories")
      .delete()
      .eq("id", storyId)
      .eq("author_id", user.id); // RLS will ensure this, but explicit check

    if (error) {
      console.error("Error deleting story:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteStory:", error);
    return { success: false, error: "Failed to delete story" };
  }
}

/**
 * Save story as highlight
 */
export async function saveStoryAsHighlight(
  storyId: string,
  title: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("stories")
      .update({
        is_highlight: true,
        highlight_title: title,
      })
      .eq("id", storyId)
      .eq("author_id", user.id);

    if (error) {
      console.error("Error saving story as highlight:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in saveStoryAsHighlight:", error);
    return { success: false, error: "Failed to save story as highlight" };
  }
}

/**
 * Get user's highlighted stories grouped by title
 */
export async function getUserHighlights(
  userId: string
): Promise<{ [title: string]: Story[] }> {
  try {
    const { data: highlights, error } = await supabase
      .from("stories")
      .select(
        `
        *,
        author:profiles!stories_author_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `
      )
      .eq("author_id", userId)
      .eq("is_highlight", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching highlights:", error);
      return {};
    }

    // Group by highlight title
    const groupedHighlights: { [title: string]: Story[] } = {};

    highlights?.forEach((story) => {
      const title = story.highlight_title || "Untitled";
      if (!groupedHighlights[title]) {
        groupedHighlights[title] = [];
      }
      groupedHighlights[title].push(story);
    });

    return groupedHighlights;
  } catch (error) {
    console.error("Error in getUserHighlights:", error);
    return {};
  }
}
