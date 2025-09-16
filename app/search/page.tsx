"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Users, Hash, TrendingUp, UserPlus, UserCheck } from "lucide-react";
import Link from "next/link";
import { searchHashtags, getTrendingHashtags } from "@/lib/hashtags";
import { getFollowStatus, toggleFollow } from "@/lib/follows";
import { getUsersStats } from "@/lib/userStats";

interface User {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

interface SearchUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  followers_count: number;
  posts_count: number;
  is_following?: boolean;
}

interface TrendingTag {
  name: string;
  post_count: number;
}

interface HashtagResult {
  name: string;
  post_count: number;
}

export default function SearchPage() {
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [hashtagResults, setHashtagResults] = useState<HashtagResult[]>([]);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SearchUser[]>([]);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [followLoadingStates, setFollowLoadingStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
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
      setLoading(false);
    };

    getUser();
  }, [router, supabase]);

  useEffect(() => {
    const loadTrendingTags = async () => {
      try {
        const trendingHashtags = await getTrendingHashtags(5);
        setTrendingTags(trendingHashtags);
      } catch (error) {
        console.error("Error loading trending tags:", error);
      }
    };

    const loadSuggestedUsers = async () => {
      if (!user) return;

      try {
        const { data: users } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .neq("id", user.id)
          .limit(5);

        if (users) {
          // Get user IDs for batch stats query
          const userIds = users.map((u: { id: string }) => u.id);
          
          // Get stats efficiently using the new function
          const usersStatsData = await getUsersStats(userIds);
          
          // Get follow status for each user
          const usersWithStats = await Promise.all(
            users.map(async (profile: { id: string; username: string; full_name: string; avatar_url?: string }) => {
              const stats = usersStatsData.find(s => s.user_id === profile.id);
              const followStatus = await getFollowStatus(user.id, profile.id);

              return {
                ...profile,
                followers_count: stats?.followers_count || 0,
                posts_count: stats?.posts_count || 0,
                is_following: followStatus?.is_following || false,
              };
            })
          );

          setSuggestedUsers(usersWithStats);
          
          // Initialize follow states
          const initialFollowingStates: Record<string, boolean> = {};
          usersWithStats.forEach((u: { id: string; is_following?: boolean }) => {
            initialFollowingStates[u.id] = u.is_following || false;
          });
          setFollowingStates(initialFollowingStates);
        }
      } catch (error) {
        console.error("Error loading suggested users:", error);
      }
    };

    if (user) {
      loadTrendingTags();
      loadSuggestedUsers();
    }
  }, [user, supabase]);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim() || !user) return;

      setSearching(true);
      try {
        // Search users
        const { data: users } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .or(
            `username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`
          )
          .neq("id", user.id)
          .limit(10);

        // Search hashtags
        const hashtags = await searchHashtags(searchQuery, 10);
        setHashtagResults(hashtags);

        if (users) {
          // Get user IDs for batch stats query
          const userIds = users.map((u: { id: string }) => u.id);
          
          // Get stats efficiently using the new function
          const usersStatsData = await getUsersStats(userIds);
          
          // Get follow status for each user
          const usersWithStats = await Promise.all(
            users.map(async (profile: { id: string; username: string; full_name: string; avatar_url?: string }) => {
              const stats = usersStatsData.find(s => s.user_id === profile.id);
              const followStatus = await getFollowStatus(user.id, profile.id);

              return {
                ...profile,
                followers_count: stats?.followers_count || 0,
                posts_count: stats?.posts_count || 0,
                is_following: followStatus?.is_following || false,
              };
            })
          );

          setSearchResults(usersWithStats);
          
          // Update follow states for search results
          const searchFollowingStates: Record<string, boolean> = {};
          usersWithStats.forEach((u: { id: string; is_following?: boolean }) => {
            searchFollowingStates[u.id] = u.is_following || false;
          });
          setFollowingStates(prev => ({ ...prev, ...searchFollowingStates }));
        }
      } catch (error) {
        console.error("Error searching:", error);
      } finally {
        setSearching(false);
      }
    };

    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
        setHashtagResults([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, user, supabase]);

  const handleFollow = async (targetUserId: string) => {
    if (!user || followLoadingStates[targetUserId]) return;

    setFollowLoadingStates(prev => ({ ...prev, [targetUserId]: true }));

    try {
      const result = await toggleFollow(user.id, targetUserId);

      if (!result) {
        console.error("Error toggling follow: No result returned");
        return;
      }

      if (result.error) {
        console.error("Follow error:", result.error);
        return;
      }

      if (result.success) {
        // Update following state
        setFollowingStates(prev => ({ ...prev, [targetUserId]: result.is_following }));

        // Update local state for both suggested users and search results
        setSuggestedUsers((prev) =>
          prev.map((u) =>
            u.id === targetUserId
              ? { 
                  ...u, 
                  followers_count: result.followers_count,
                  is_following: result.is_following 
                }
              : u
          )
        );
        
        setSearchResults((prev) =>
          prev.map((u) =>
            u.id === targetUserId
              ? { 
                  ...u, 
                  followers_count: result.followers_count,
                  is_following: result.is_following 
                }
              : u
          )
        );
      }
    } catch (error) {
      console.error("Error following user:", error);
    } finally {
      setFollowLoadingStates(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <Navigation user={undefined} />
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  const UserCard = ({
    user: searchUser,
    showFollowButton = true,
  }: {
    user: SearchUser;
    showFollowButton?: boolean;
  }) => {
    const initials =
      searchUser.full_name
        ?.split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase() || searchUser.username[0].toUpperCase();

    const isFollowing = followingStates[searchUser.id] || searchUser.is_following || false;
    const isLoading = followLoadingStates[searchUser.id] || false;

    return (
      <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/profile/${searchUser.username}`}
              className="flex items-center space-x-3 flex-1"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={searchUser.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {searchUser.full_name || searchUser.username}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  @{searchUser.username}
                </p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-xs text-gray-500">
                    {searchUser.followers_count} followers
                  </span>
                  <span className="text-xs text-gray-500">
                    {searchUser.posts_count} posts
                  </span>
                </div>
              </div>
            </Link>
            {showFollowButton && (
              <Button
                onClick={() => handleFollow(searchUser.id)}
                disabled={isLoading}
                size="sm"
                className={`${
                  isFollowing
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    Loading...
                  </>
                ) : isFollowing ? (
                  <>
                    <UserCheck className="h-3 w-3 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Navigation user={user} />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Discover
            </h1>
            <p className="text-gray-600">
              Find new people and explore trending topics
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 focus:border-pink-300 focus:ring-pink-200"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                </div>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="space-y-6">
              {/* User Results */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  People
                </h2>
                {searchResults.length === 0 && !searching ? (
                  <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No users found for &ldquo;{searchQuery}&rdquo;
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map((searchUser) => (
                      <UserCard key={searchUser.id} user={searchUser} />
                    ))}
                  </div>
                )}
              </div>

              {/* Hashtag Results */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <Hash className="h-5 w-5 mr-2" />
                  Hashtags
                </h2>
                {hashtagResults.length === 0 && !searching ? (
                  <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <Hash className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No hashtags found for &ldquo;{searchQuery}&rdquo;
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {hashtagResults.map((hashtag) => (
                      <Link
                        key={hashtag.name}
                        href={`/hashtag/${encodeURIComponent(hashtag.name)}`}
                      >
                        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                                  <Hash className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    #{hashtag.name}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {hashtag.post_count} posts
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trending Topics */}
          {!searchQuery.trim() && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Trending Topics
                </h2>
                <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    {trendingTags.map((tag, index) => (
                      <Link
                        key={tag.name}
                        href={`/hashtag/${encodeURIComponent(tag.name)}`}
                        className="flex items-center justify-between py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              #{tag.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {tag.post_count} posts
                            </p>
                          </div>
                        </div>
                        <Hash className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Suggested Users */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Suggested for You
                </h2>
                <div className="space-y-3">
                  {suggestedUsers.map((suggestedUser) => (
                    <UserCard key={suggestedUser.id} user={suggestedUser} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
