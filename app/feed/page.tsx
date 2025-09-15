"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navigation } from "@/components/Navigation";
import { PostCard } from "@/components/PostCard";
import { CreatePost } from "@/components/CreatePost";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw } from "lucide-react";
import { processPostContent } from "@/lib/hashtags";

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
}

export default function FeedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const fetchPosts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("get_posts_with_stats", {
        user_id_param: user?.id,
      });

      if (error) throw error;

      const formattedPosts: Post[] = data.map(
        (post: {
          id: string;
          content: string;
          image_url?: string;
          created_at: string;
          author_username: string;
          author_full_name: string;
          author_avatar_url?: string;
          likes_count: number;
          comments_count: number;
          user_has_liked: boolean;
        }) => ({
          id: post.id,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          author: {
            username: post.author_username,
            full_name: post.author_full_name,
            avatar_url: post.author_avatar_url,
          },
          likes_count: post.likes_count,
          comments_count: post.comments_count,
          user_has_liked: post.user_has_liked,
        })
      );

      setPosts(formattedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, fetchPosts]);

  const handleCreatePost = async (content: string, imageUrl?: string) => {
    if (!user) return;

    try {
      const { data: newPost, error } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          content,
          image_url: imageUrl,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Process hashtags and mentions in the background
      if (newPost) {
        processPostContent(newPost.id, content, user.id);
      }

      // Refresh posts
      await fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

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

      // Update local state immediately for better UX
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
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
          <span className="text-gray-600 dark:text-gray-300">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation user={user} />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Create Post */}
          <CreatePost user={user} onPost={handleCreatePost} />

          {/* Refresh Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh feed"}
            </Button>
          </div>

          {/* Posts */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full mx-auto flex items-center justify-center">
                <span className="text-4xl">🌸</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Your feed is peaceful
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Start following people to see their posts here, or create your
                first post to share with the community.
              </p>
            </div>
          ) : (
            <ScrollArea className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="mb-6">
                  <PostCard
                    post={post}
                    currentUserId={user.id}
                    onLike={handleLike}
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
