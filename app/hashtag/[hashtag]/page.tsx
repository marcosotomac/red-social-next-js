"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navigation } from "@/components/Navigation";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Hash, Loader2 } from "lucide-react";
import { getPostsByHashtag } from "@/lib/hashtags";

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

interface HashtagInfo {
  name: string;
  post_count: number;
}

export default function HashtagPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtagInfo, setHashtagInfo] = useState<HashtagInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const hashtag = decodeURIComponent(params.hashtag as string);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profile) {
        setUser(profile);
      }
    };

    getUser();
  }, [router, supabase]);

  useEffect(() => {
    const fetchHashtagData = async () => {
      if (!hashtag) return;

      try {
        setLoading(true);

        // Get hashtag info
        const { data: hashtagData, error: hashtagError } = await supabase
          .from("hashtags")
          .select("name, post_count")
          .eq("name", hashtag.toLowerCase())
          .single();

        if (hashtagError) {
          console.error("Error fetching hashtag:", hashtagError);
        } else if (hashtagData) {
          setHashtagInfo(hashtagData);
        }

        // Get posts
        const hashtagPosts = await getPostsByHashtag(hashtag.toLowerCase());

        // Add engagement data for each post
        const postsWithEngagement = await Promise.all(
          hashtagPosts.map(async (post) => {
            // Get likes count
            const { count: likesCount } = await supabase
              .from("likes")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            // Get comments count
            const { count: commentsCount } = await supabase
              .from("comments")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            // Check if user liked this post
            let userHasLiked = false;
            if (user) {
              const { data: userLike } = await supabase
                .from("likes")
                .select("id")
                .eq("post_id", post.id)
                .eq("user_id", user.id)
                .single();
              userHasLiked = !!userLike;
            }

            return {
              ...post,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              user_has_liked: userHasLiked,
            };
          })
        );

        setPosts(postsWithEngagement);
      } catch (error) {
        console.error("Error fetching hashtag data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchHashtagData();
    }
  }, [hashtag, user, supabase]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation user={user} />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>

          {/* Hashtag Header */}
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg rounded-2xl overflow-hidden">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Hash className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {hashtag}
                </CardTitle>
              </div>
              {hashtagInfo && (
                <Badge variant="secondary" className="mx-auto">
                  {hashtagInfo.post_count === 1
                    ? "1 post"
                    : `${hashtagInfo.post_count} posts`}
                </Badge>
              )}
            </CardHeader>
          </Card>

          {/* Posts */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
          ) : posts.length === 0 ? (
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="text-center py-12 space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full mx-auto flex items-center justify-center">
                  <Hash className="h-12 w-12 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  No posts found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Be the first to post with #{hashtag}!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={user.id} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
