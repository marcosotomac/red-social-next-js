"use client";

import { useEffect, useState, useRef } from "react";
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
import {
  getFollowStatus,
  toggleFollow,
  subscribeToFollowChanges,
} from "@/lib/follows";
import { useThrottle } from "@/hooks/useDebounce";

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
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const followingRef = useRef(false); // Ref to prevent race conditions
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

      // Get follow status and counts using the new function
      const followStatus = await getFollowStatus(
        currentUser?.id || null,
        profile.id
      );

      if (followStatus) {
        setFollowersCount(followStatus.followers_count);
        setFollowingCount(followStatus.following_count);
        setIsFollowing(followStatus.is_following);
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

  // Subscribe to real-time follow changes
  useEffect(() => {
    if (!profileUser?.id) return;

    const subscription = subscribeToFollowChanges(profileUser.id, () => {
      // Refresh follow status when changes occur
      if (currentUser) {
        getFollowStatus(currentUser.id, profileUser.id).then((status) => {
          if (status) {
            setFollowersCount(status.followers_count);
            setIsFollowing(status.is_following);
          }
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [profileUser?.id, currentUser]);

  const handleFollow = async () => {
    if (
      !currentUser ||
      !profileUser ||
      isOwnProfile ||
      isFollowLoading ||
      followingRef.current
    )
      return;

    // Set both state and ref to prevent multiple calls
    setIsFollowLoading(true);
    followingRef.current = true;

    try {
      console.log("Starting follow action for:", profileUser.username);

      // Use the new toggle_follow function
      const result = await toggleFollow(currentUser.id, profileUser.id);

      console.log("Follow result:", result);

      if (!result) {
        console.error("Error toggling follow: No result returned");
        return;
      }

      if (result.error) {
        console.error("Follow error:", result.error);
        return;
      }

      // Update local state with the response from the database
      if (result.success) {
        setIsFollowing(result.is_following);
        setFollowersCount(result.followers_count);
        console.log(
          "Follow status updated:",
          result.is_following,
          "Followers:",
          result.followers_count,
          "Action:",
          result.action
        );

        // Update the ref to match the new state
        followingRef.current = false;
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      // Reset both state and ref
      setIsFollowLoading(false);
      followingRef.current = false;
    }
  };

  // Throttle the follow function to prevent rapid clicks
  const throttledHandleFollow = useThrottle(handleFollow, 1000);

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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
        <Navigation user={currentUser || undefined} />
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-600 dark:text-gray-400">
            Loading profile...
          </span>
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      <Navigation user={currentUser || undefined} />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="md:col-span-1">
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg rounded-2xl overflow-hidden sticky top-24">
              <CardHeader className="text-center pb-4">
                <Avatar className="h-24 w-24 mx-auto ring-4 ring-pink-100 dark:ring-pink-900/50">
                  <AvatarImage src={profileUser.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-bold text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {profileUser.full_name || profileUser.username}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    @{profileUser.username}
                  </p>
                </div>

                {!isOwnProfile && (
                  <Button
                    onClick={throttledHandleFollow}
                    disabled={isFollowLoading}
                    className={`mt-3 ${
                      isFollowing
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    } ${
                      isFollowLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isFollowLoading ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300"></div>
                        Loading...
                      </>
                    ) : isFollowing ? (
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
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {profileUser.bio}
                  </p>
                )}

                {/* Website */}
                {profileUser.website && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <LinkIcon className="h-4 w-4" />
                    <a
                      href={profileUser.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 dark:text-pink-400 hover:underline"
                    >
                      {profileUser.website}
                    </a>
                  </div>
                )}

                {/* Join Date */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
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
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {posts.length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Posts
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {followersCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Followers
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-gray-100">
                      {followingCount}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Following
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Posts */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Posts
              </h2>
              <Badge
                variant="secondary"
                className="bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300"
              >
                {posts.length}
              </Badge>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 rounded-full mx-auto flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {isOwnProfile
                    ? "You haven't posted yet"
                    : `${profileUser.username} hasn't posted yet`}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
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
