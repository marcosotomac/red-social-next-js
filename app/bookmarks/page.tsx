"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navigation } from "@/components/Navigation";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Bookmark, ArrowLeft } from "lucide-react";
import { toggleBookmark } from "@/lib/bookmarks";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

interface Post {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  author: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  user_has_bookmarked: boolean;
}

export default function BookmarksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      // Get profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profile) {
        setUser({
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        });
      }
    };

    getUser();
  }, [router, supabase]);

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Use the optimized function from lib/bookmarks.ts
      const { getUserBookmarks } = await import("@/lib/bookmarks");
      const bookmarksData = await getUserBookmarks(user.id);

      // Transform bookmarks data to match Post interface
      const transformedPosts: Post[] = bookmarksData.map((bookmark) => ({
        id: bookmark.post.id,
        content: bookmark.post.content,
        image_url: bookmark.post.image_url,
        created_at: bookmark.post.created_at,
        author: {
          username: bookmark.post.author.username,
          full_name: bookmark.post.author.full_name,
          avatar_url: bookmark.post.author.avatar_url,
        },
        likes_count: bookmark.post.likes_count || 0,
        comments_count: bookmark.post.comments_count || 0,
        user_has_liked: bookmark.post.user_has_liked || false,
        user_has_bookmarked: true, // All posts here are bookmarked
      }));

      setPosts(transformedPosts);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user, fetchBookmarks]);

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.user_has_liked) {
        // Unlike
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        // Like
        await supabase.from("likes").insert({
          post_id: postId,
          user_id: user.id,
        });
      }

      // Update local state
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                user_has_liked: !p.user_has_liked,
                likes_count: p.user_has_liked
                  ? p.likes_count - 1
                  : p.likes_count + 1,
              }
            : p
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to toggle like");
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!user) return;

    try {
      // Remove bookmark (since all posts here are bookmarked)
      await toggleBookmark(postId, user.id);

      // Remove post from local state
      setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));

      toast.success("Bookmark removed!");
    } catch (error) {
      console.error("Error removing bookmark:", error);
      toast.error("Failed to remove bookmark");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
        <Navigation />
        <main className="pt-16 pb-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
      <Navigation />
      <main className="pt-16 pb-8">
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Bookmark className="h-5 w-5 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Bookmarks
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {posts.length} saved {posts.length === 1 ? "post" : "posts"}
                </p>
              </div>
            </div>
          </div>

          {/* Bookmarked Posts */}
          {posts.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full mx-auto flex items-center justify-center">
                <Bookmark className="h-8 w-8 text-purple-500 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                No bookmarks yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                When you bookmark posts, they&apos;ll show up here so you can
                easily find them later.
              </p>
              <Button
                onClick={() => router.push("/feed")}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white mt-4"
              >
                Explore Posts
              </Button>
            </div>
          ) : (
            <ScrollArea className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="mb-6">
                  <PostCard
                    post={post}
                    currentUserId={user?.id}
                    onLike={handleLike}
                    onBookmark={handleBookmark}
                  />
                </div>
              ))}
            </ScrollArea>
          )}
        </div>
      </main>
    </div>
  );
}
