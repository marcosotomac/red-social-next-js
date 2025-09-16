"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ParsedText } from "@/components/ParsedText";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  likes_count: number;
  is_liked_by_user: boolean;
}

interface CommentsProps {
  postId: string;
  currentUserId?: string;
  isOpen: boolean;
  onToggle: () => void;
  commentsCount: number;
  onCommentsCountChange?: (newCount: number) => void;
}

export function Comments({
  postId,
  currentUserId,
  isOpen,
  onToggle,
  commentsCount,
  onCommentsCountChange,
}: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const loadComments = async () => {
      setLoading(true);
      try {
        const { data: commentsData, error } = await supabase
          .from("comments")
          .select(
            `
            id,
            content,
            created_at,
            author:profiles!comments_author_id_fkey (
              id,
              username,
              full_name,
              avatar_url
            )
          `
          )
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        // Get likes count and user likes for each comment
        const commentsWithLikes = await Promise.all(
          (commentsData || []).map(async (comment) => {
            const [likesResponse, userLikeResponse] = await Promise.all([
              supabase.from("likes").select("id").eq("comment_id", comment.id),
              currentUserId
                ? supabase
                    .from("likes")
                    .select("id")
                    .eq("comment_id", comment.id)
                    .eq("user_id", currentUserId)
                    .single()
                : Promise.resolve({ data: null }),
            ]);

            return {
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              user: Array.isArray(comment.author)
                ? comment.author[0]
                : comment.author,
              likes_count: likesResponse.data?.length || 0,
              is_liked_by_user: !!userLikeResponse.data,
            };
          })
        );

        setComments(commentsWithLikes);
      } catch (error) {
        console.log("Error loading comments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadComments();

      // Set up real-time subscription for new comments
      const commentsSubscription = supabase
        .channel(`comments-${postId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "comments",
            filter: `post_id=eq.${postId}`,
          },
          () => {
            // Reload comments when a new one is added
            loadComments();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "comments",
            filter: `post_id=eq.${postId}`,
          },
          () => {
            // Reload comments when one is deleted
            loadComments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(commentsSubscription);
      };
    }
  }, [isOpen, postId, currentUserId, supabase]);

  const reloadComments = async () => {
    if (!isOpen) return;

    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select(
          `
          id,
          content,
          created_at,
          author:profiles!comments_author_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get likes count and user likes for each comment
      const commentsWithLikes = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const [likesResponse, userLikeResponse] = await Promise.all([
            supabase.from("likes").select("id").eq("comment_id", comment.id),
            currentUserId
              ? supabase
                  .from("likes")
                  .select("id")
                  .eq("comment_id", comment.id)
                  .eq("user_id", currentUserId)
                  .single()
              : Promise.resolve({ data: null }),
          ]);

          return {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            user: Array.isArray(comment.author)
              ? comment.author[0]
              : comment.author,
            likes_count: likesResponse.data?.length || 0,
            is_liked_by_user: !!userLikeResponse.data,
          };
        })
      );

      setComments(commentsWithLikes);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        content: newComment.trim(),
        post_id: postId,
        author_id: currentUserId,
      });

      if (error) throw error;

      setNewComment("");

      // Update comments count
      onCommentsCountChange?.(commentsCount + 1);

      await reloadComments();
    } catch (error) {
      console.log("Error posting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!currentUserId) return;

    try {
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", currentUserId);
      } else {
        await supabase.from("likes").insert({
          comment_id: commentId,
          user_id: currentUserId,
        });
      }

      // Update local state
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                likes_count: isLiked
                  ? comment.likes_count - 1
                  : comment.likes_count + 1,
                is_liked_by_user: !isLiked,
              }
            : comment
        )
      );
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("author_id", currentUserId);

      if (error) throw error;

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));

      // Update comments count
      onCommentsCountChange?.(commentsCount - 1);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Comments toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={`flex items-center space-x-2 h-7 sm:h-8 px-1 sm:px-2 transition-all duration-200 ${
          isOpen
            ? "text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        }`}
      >
        <div className="relative">
          <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          {isOpen && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          )}
        </div>
        <span className="text-xs sm:text-sm font-medium">{commentsCount}</span>
        {isOpen && (
          <span className="text-xs text-blue-500 font-medium">• Thread</span>
        )}
      </Button>

      {/* Comments section */}
      {isOpen && (
        <div className="relative bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-3 sm:p-4 border border-blue-100/50 dark:border-blue-800/30 backdrop-blur-sm">
          {/* Thread connector line */}
          <div className="absolute left-6 sm:left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-indigo-200 to-transparent dark:from-blue-700 dark:via-indigo-700 opacity-60"></div>

          <div className="space-y-3 sm:space-y-4">
            {/* New comment form */}
            {currentUserId && (
              <div className="relative flex space-x-2 sm:space-x-3 ml-4 sm:ml-6">
                {/* Thread indicator */}
                <div className="absolute -left-4 sm:-left-6 top-2 w-3 h-3 border-2 border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
                  <div className="w-1.5 h-1.5 bg-blue-400 dark:bg-blue-500 rounded-full"></div>
                </div>

                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 ring-2 ring-blue-100 dark:ring-blue-800">
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs sm:text-sm font-semibold">
                    U
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="relative">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Reply to this thread..."
                      className="min-h-[70px] sm:min-h-[80px] resize-none border-gray-200 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-600 focus:ring-blue-200 dark:focus:ring-blue-800 text-sm sm:text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl"
                    />
                    <MessageCircle className="absolute top-3 right-3 h-4 w-4 text-blue-300 dark:text-blue-600" />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submitting}
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs sm:text-sm px-3 sm:px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {submitting ? "Posting..." : "Reply"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments list */}
            {loading ? (
              <div className="text-center py-3 sm:py-4 text-gray-500 dark:text-gray-400 text-sm ml-4 sm:ml-6">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400 ml-4 sm:ml-6">
                <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm sm:text-base">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {comments.map((comment) => {
                  const initials =
                    comment.user.full_name
                      ?.split(" ")
                      .map((name) => name[0])
                      .join("")
                      .toUpperCase() || comment.user.username[0].toUpperCase();

                  return (
                    <div key={comment.id} className="relative ml-4 sm:ml-6">
                      {/* Thread node indicator */}
                      <div className="absolute -left-4 sm:-left-6 top-3 w-3 h-3 border-2 border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-500 rounded-full"></div>
                      </div>

                      <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-l-4 border-l-indigo-200 dark:border-l-indigo-700 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden">
                        <CardContent className="p-2 sm:p-3">
                          <div className="flex space-x-2 sm:space-x-3">
                            <Avatar className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 ring-2 ring-indigo-100 dark:ring-indigo-800">
                              <AvatarImage src={comment.user.avatar_url} />
                              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-blue-500 text-white text-xs font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              {/* Header with name, username, time and actions in one line */}
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center space-x-1 min-w-0 flex-1">
                                  <MessageCircle className="h-3 w-3 text-indigo-400 dark:text-indigo-500 flex-shrink-0" />
                                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs sm:text-sm truncate">
                                    {comment.user.full_name ||
                                      comment.user.username}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    @{comment.user.username}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    •
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                    {formatDistanceToNow(
                                      new Date(comment.created_at),
                                      { addSuffix: true }
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  {/* Like button moved to the right */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleLikeComment(
                                        comment.id,
                                        comment.is_liked_by_user
                                      )
                                    }
                                    className={`flex items-center space-x-1 h-5 sm:h-6 px-1 transition-all duration-200 ${
                                      comment.is_liked_by_user
                                        ? "text-pink-600 hover:text-pink-700 bg-pink-50 dark:bg-pink-900/20"
                                        : "text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                                    }`}
                                  >
                                    <Heart
                                      className={`h-3 w-3 transition-all duration-200 ${
                                        comment.is_liked_by_user
                                          ? "fill-current scale-110"
                                          : ""
                                      }`}
                                    />
                                    {comment.likes_count > 0 && (
                                      <span className="text-xs font-medium">
                                        {comment.likes_count}
                                      </span>
                                    )}
                                  </Button>
                                  {/* Delete menu if owner */}
                                  {currentUserId === comment.user.id && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                        >
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90"
                                      >
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleDeleteComment(comment.id)
                                          }
                                          className="text-red-600 focus:text-red-600 text-sm"
                                        >
                                          <Trash2 className="h-3 w-3 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                              {/* Content */}
                              <div className="text-gray-800 dark:text-gray-200 leading-relaxed text-xs sm:text-sm break-words">
                                <ParsedText content={comment.content} />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
