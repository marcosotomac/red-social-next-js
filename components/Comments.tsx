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
}

export function Comments({
  postId,
  currentUserId,
  isOpen,
  onToggle,
  commentsCount,
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
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <div className="space-y-3">
      {/* Comments toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="flex items-center space-x-2 text-gray-600 hover:text-pink-600 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        <span>
          {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
        </span>
      </Button>

      {/* Comments section */}
      {isOpen && (
        <div className="space-y-4 border-t border-gray-100 pt-4">
          {/* New comment form */}
          {currentUserId && (
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-sm">
                  U
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[80px] resize-none border-gray-200 focus:border-pink-300 focus:ring-pink-200"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submitting}
                    size="sm"
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {submitting ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Comments list */}
          {loading ? (
            <div className="text-center py-4 text-gray-500">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const initials =
                  comment.user.full_name
                    ?.split(" ")
                    .map((name) => name[0])
                    .join("")
                    .toUpperCase() || comment.user.username[0].toUpperCase();

                return (
                  <Card key={comment.id} className="border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.user.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {comment.user.full_name ||
                                  comment.user.username}
                              </span>
                              <span className="text-gray-500">
                                @{comment.user.username}
                              </span>
                              <span className="text-gray-400">·</span>
                              <span className="text-gray-500 text-sm">
                                {formatDistanceToNow(
                                  new Date(comment.created_at),
                                  { addSuffix: true }
                                )}
                              </span>
                            </div>
                            {currentUserId === comment.user.id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteComment(comment.id)
                                    }
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <p className="text-gray-800 leading-relaxed">
                            {comment.content}
                          </p>
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleLikeComment(
                                  comment.id,
                                  comment.is_liked_by_user
                                )
                              }
                              className={`flex items-center space-x-1 h-8 px-2 ${
                                comment.is_liked_by_user
                                  ? "text-pink-600 hover:text-pink-700"
                                  : "text-gray-500 hover:text-pink-600"
                              }`}
                            >
                              <Heart
                                className={`h-3 w-3 ${
                                  comment.is_liked_by_user ? "fill-current" : ""
                                }`}
                              />
                              {comment.likes_count > 0 && (
                                <span className="text-xs">
                                  {comment.likes_count}
                                </span>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
