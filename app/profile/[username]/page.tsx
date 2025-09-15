"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navigation } from "@/components/Navigation";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserPlus, UserCheck, Calendar, Link as LinkIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  created_at: string;
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

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getCurrentUser = async () => {
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
        setCurrentUser(profile);
        setIsOwnProfile(profile.username === username);
      }
    };

    getCurrentUser();
  }, [username, router, supabase]);

  useEffect(() => {
    const getProfileData = async () => {
      // Get profile user
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (!profile) {
        router.push("/feed");
        return;
      }

      setProfileUser(profile);

      // Get followers count
      const { count: followersCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id);

      setFollowersCount(followersCount || 0);

      // Get following count
      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile.id);

      setFollowingCount(followingCount || 0);

      // Check if current user is following this profile
      if (currentUser && !isOwnProfile) {
        const { data: followData } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", currentUser.id)
          .eq("following_id", profile.id)
          .single();

        setIsFollowing(!!followData);
      }

      // Get user's posts
      const { data: postsData, error } = await supabase.rpc(
        "get_posts_with_stats",
        { user_id_param: currentUser?.id }
      );

      if (!error && postsData) {
        const userPosts = postsData
          .filter(
            (post: { author_username: string }) =>
              post.author_username === username
          )
          .map(
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

        setPosts(userPosts);
      }

      setLoading(false);
    };

    if (currentUser) {
      getProfileData();
    }
  }, [username, currentUser, isOwnProfile, router, supabase]);

  const handleFollow = async () => {
    if (!currentUser || !profileUser || isOwnProfile) return;

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", profileUser.id);

        setIsFollowing(false);
        setFollowersCount((prev) => prev - 1);
      } else {
        // Follow
        await supabase.from("follows").insert({
          follower_id: currentUser.id,
          following_id: profileUser.id,
        });

        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;

    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.user_has_liked) {
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUser.id);
      } else {
        await supabase.from("likes").insert({
          post_id: postId,
          user_id: currentUser.id,
        });
      }

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

  if (!currentUser || !profileUser || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <Navigation user={currentUser || undefined} />
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  const initials =
    profileUser.full_name
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase() || profileUser.username[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Navigation user={currentUser || undefined} />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="md:col-span-1">
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-lg rounded-2xl overflow-hidden sticky top-24">
              <CardHeader className="text-center pb-4">
                <Avatar className="h-24 w-24 mx-auto ring-4 ring-pink-100">
                  <AvatarImage src={profileUser.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-bold text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-gray-900">
                    {profileUser.full_name || profileUser.username}
                  </h1>
                  <p className="text-gray-500">@{profileUser.username}</p>
                </div>

                {!isOwnProfile && (
                  <Button
                    onClick={handleFollow}
                    className={`mt-3 ${
                      isFollowing
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Bio */}
                {profileUser.bio && (
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {profileUser.bio}
                  </p>
                )}

                {/* Website */}
                {profileUser.website && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <LinkIcon className="h-4 w-4" />
                    <a
                      href={profileUser.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:underline"
                    >
                      {profileUser.website}
                    </a>
                  </div>
                )}

                {/* Join Date */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined{" "}
                    {formatDistanceToNow(new Date(profileUser.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <Separator />

                {/* Stats */}
                <div className="flex justify-between text-center">
                  <div>
                    <p className="font-bold text-gray-900">{posts.length}</p>
                    <p className="text-xs text-gray-500">Posts</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{followersCount}</p>
                    <p className="text-xs text-gray-500">Followers</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{followingCount}</p>
                    <p className="text-xs text-gray-500">Following</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Posts */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-gray-900">Posts</h2>
              <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                {posts.length}
              </Badge>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mx-auto flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {isOwnProfile
                    ? "You haven't posted yet"
                    : `${profileUser.username} hasn't posted yet`}
                </h3>
                <p className="text-gray-600">
                  {isOwnProfile
                    ? "Share your first thought with the community!"
                    : "Check back later for updates."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onLike={handleLike} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
