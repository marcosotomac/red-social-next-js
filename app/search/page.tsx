"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Users,
  Hash,
  TrendingUp,
  UserPlus,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);
  const [followingStates, setFollowingStates] = useState<
    Record<string, boolean>
  >({});
  const [followLoadingStates, setFollowLoadingStates] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const USERS_PER_PAGE = 4; // 2 filas x 2 columnas

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

  // Function to load suggested users
  const loadSuggestedUsers = useCallback(
    async (page = 0) => {
      if (!user) return;

      try {
        setLoadingMoreUsers(true);

        const { data: users } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .neq("id", user.id)
          .order("created_at", { ascending: false })
          .range(page * USERS_PER_PAGE, (page + 1) * USERS_PER_PAGE - 1);

        if (users) {
          // Check if there are more users to load
          setHasMoreUsers(users.length === USERS_PER_PAGE);

          // Get user IDs for batch stats query
          const userIds = users.map((u: { id: string }) => u.id);

          // Get stats efficiently using the new function
          const usersStatsData = await getUsersStats(userIds);

          // Get follow status for each user
          const usersWithStats = await Promise.all(
            users.map(
              async (profile: {
                id: string;
                username: string;
                full_name: string;
                avatar_url?: string;
              }) => {
                const stats = usersStatsData.find(
                  (s) => s.user_id === profile.id
                );
                const followStatus = await getFollowStatus(user.id, profile.id);

                return {
                  ...profile,
                  followers_count: stats?.followers_count || 0,
                  posts_count: stats?.posts_count || 0,
                  is_following: followStatus?.is_following || false,
                };
              }
            )
          );

          // Always replace users (not append)
          setSuggestedUsers(usersWithStats);

          // Initialize follow states
          const initialFollowingStates: Record<string, boolean> = {};
          usersWithStats.forEach(
            (u: { id: string; is_following?: boolean }) => {
              initialFollowingStates[u.id] = u.is_following || false;
            }
          );
          setFollowingStates((prev) => ({
            ...prev,
            ...initialFollowingStates,
          }));
        }
      } catch (error) {
        console.error("Error loading suggested users:", error);
      } finally {
        setLoadingMoreUsers(false);
      }
    },
    [user, supabase]
  );

  // Function to load more users
  const loadMoreUsers = async () => {
    if (!hasMoreUsers || loadingMoreUsers) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadSuggestedUsers(nextPage);
  };

  // Function to load previous users
  const loadPreviousUsers = async () => {
    if (currentPage <= 0 || loadingMoreUsers) return;
    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);
    await loadSuggestedUsers(prevPage);
  };

  useEffect(() => {
    const loadTrendingTags = async () => {
      try {
        const trendingHashtags = await getTrendingHashtags(5);
        setTrendingTags(trendingHashtags);
      } catch (error) {
        console.error("Error loading trending tags:", error);
      }
    };

    if (user) {
      loadTrendingTags();
      loadSuggestedUsers(0);
    }
  }, [user, supabase, loadSuggestedUsers]);

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
            users.map(
              async (profile: {
                id: string;
                username: string;
                full_name: string;
                avatar_url?: string;
              }) => {
                const stats = usersStatsData.find(
                  (s) => s.user_id === profile.id
                );
                const followStatus = await getFollowStatus(user.id, profile.id);

                return {
                  ...profile,
                  followers_count: stats?.followers_count || 0,
                  posts_count: stats?.posts_count || 0,
                  is_following: followStatus?.is_following || false,
                };
              }
            )
          );

          setSearchResults(usersWithStats);

          // Update follow states for search results
          const searchFollowingStates: Record<string, boolean> = {};
          usersWithStats.forEach(
            (u: { id: string; is_following?: boolean }) => {
              searchFollowingStates[u.id] = u.is_following || false;
            }
          );
          setFollowingStates((prev) => ({ ...prev, ...searchFollowingStates }));
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

    setFollowLoadingStates((prev) => ({ ...prev, [targetUserId]: true }));

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
        setFollowingStates((prev) => ({
          ...prev,
          [targetUserId]: result.is_following,
        }));

        // Update local state for both suggested users and search results
        setSuggestedUsers((prev) =>
          prev.map((u) =>
            u.id === targetUserId
              ? {
                  ...u,
                  followers_count: result.followers_count,
                  is_following: result.is_following,
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
                  is_following: result.is_following,
                }
              : u
          )
        );
      }
    } catch (error) {
      console.error("Error following user:", error);
    } finally {
      setFollowLoadingStates((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation user={undefined} />
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-600 dark:text-gray-300">Loading...</span>
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

    const isFollowing =
      followingStates[searchUser.id] || searchUser.is_following || false;
    const isLoading = followLoadingStates[searchUser.id] || false;

    return (
      <Card className="w-full backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
        <CardContent className="p-3 sm:p-6 lg:p-8 h-full">
          <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-6 h-full">
            <Link
              href={`/profile/${searchUser.username}`}
              className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6 flex-1 min-w-0"
            >
              <Avatar className="h-10 w-10 sm:h-16 sm:w-16 lg:h-20 lg:w-20 flex-shrink-0 ring-2 ring-pink-100 dark:ring-pink-900/50 lg:ring-4">
                <AvatarImage src={searchUser.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-xs sm:text-lg lg:text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm sm:text-lg lg:text-xl">
                  {searchUser.full_name || searchUser.username}
                </h3>
                <p className="text-xs sm:text-base lg:text-lg text-gray-500 dark:text-gray-400 truncate">
                  @{searchUser.username}
                </p>
                <div className="flex items-center space-x-2 sm:space-x-6 lg:space-x-8 mt-1 sm:mt-2 lg:mt-3">
                  <span className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {searchUser.followers_count}
                    </span>{" "}
                    followers
                  </span>
                  <span className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {searchUser.posts_count}
                    </span>{" "}
                    posts
                  </span>
                </div>
              </div>
            </Link>
            {showFollowButton && (
              <Button
                onClick={() => handleFollow(searchUser.id)}
                disabled={isLoading}
                size="sm"
                className={`flex-shrink-0 text-xs sm:text-sm lg:text-base px-2 sm:px-4 lg:px-6 py-1 sm:py-2 lg:py-3 font-medium ${
                  isFollowing
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isLoading ? (
                  <>
                    <div className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300"></div>
                    <span className="hidden sm:inline">Loading...</span>
                  </>
                ) : isFollowing ? (
                  <>
                    <UserCheck className="h-3 w-3 lg:h-4 lg:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 lg:h-4 lg:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Follow</span>
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation user={user} />

      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Discover
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
              Find new people and explore trending topics
            </p>

            {/* Search Bar */}
            <div className="max-w-md lg:max-w-lg mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-200 dark:border-gray-700 focus:border-pink-300 dark:focus:border-pink-600 focus:ring-pink-200 dark:focus:ring-pink-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
            <div className="space-y-4 sm:space-y-6">
              {/* User Results */}
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  People
                </h2>
                {searchResults.length === 0 && !searching ? (
                  <Card className="w-full backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-sm">
                    <CardContent className="p-6 sm:p-8 text-center">
                      <Search className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                        No users found for &ldquo;{searchQuery}&rdquo;
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {searchResults.map((searchUser) => (
                      <UserCard key={searchUser.id} user={searchUser} />
                    ))}
                  </div>
                )}
              </div>

              {/* Hashtag Results */}
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <Hash className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Hashtags
                </h2>
                {hashtagResults.length === 0 && !searching ? (
                  <Card className="w-full backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-sm">
                    <CardContent className="p-6 sm:p-8 text-center">
                      <Hash className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                        No hashtags found for &ldquo;{searchQuery}&rdquo;
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="xl:col-span-1 space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2" />
                  Trending Topics
                </h2>
                <Card className="w-full backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-sm">
                  <CardContent className="p-3 sm:p-4 lg:p-6 space-y-2 sm:space-y-3">
                    {trendingTags.map((tag, index) => (
                      <Link
                        key={tag.name}
                        href={`/hashtag/${encodeURIComponent(tag.name)}`}
                        className="flex items-center justify-between py-3 lg:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-3 lg:px-4 transition-colors"
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 min-w-0 flex-1">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs sm:text-sm lg:text-base font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm sm:text-base lg:text-lg">
                              #{tag.name}
                            </p>
                            <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400">
                              {tag.post_count} posts
                            </p>
                          </div>
                        </div>
                        <Hash className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Suggested Users */}
              <div className="xl:col-span-2 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-2" />
                    Suggested for You
                  </h2>
                  {suggestedUsers.length > 0 && (
                    <div className="flex items-center justify-center sm:justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadPreviousUsers}
                        disabled={currentPage === 0 || loadingMoreUsers}
                        className="px-2 py-1 lg:px-3 lg:py-2 border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                      >
                        <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 min-w-[50px] sm:min-w-[60px] lg:min-w-[80px] text-center">
                        Página {currentPage + 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadMoreUsers}
                        disabled={!hasMoreUsers || loadingMoreUsers}
                        className="px-2 py-1 lg:px-3 lg:py-2 border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                      >
                        {loadingMoreUsers ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        ) : (
                          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Grid responsive para usuarios sugeridos */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                  {suggestedUsers.map((suggestedUser) => (
                    <div key={suggestedUser.id} className="w-full">
                      <UserCard user={suggestedUser} />
                    </div>
                  ))}
                </div>

                {/* Mostrar mensaje si no hay usuarios */}
                {suggestedUsers.length === 0 && !loadingMoreUsers && (
                  <Card className="w-full backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-sm">
                    <CardContent className="p-6 sm:p-8 text-center">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                        No hay usuarios sugeridos disponibles
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
