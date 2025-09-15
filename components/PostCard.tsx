"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Comments } from "@/components/Comments";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { ParsedText } from "@/components/ParsedText";

interface PostCardProps {
  post: {
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
  };
  currentUserId?: string;
  onLike?: (postId: string) => void;
}

export function PostCard({ post, currentUserId, onLike }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.user_has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.(post.id);
  };

  const handleCommentToggle = () => {
    setCommentsOpen(!commentsOpen);
  };

  const initials =
    post.author.full_name
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase() || post.author.username[0].toUpperCase();

  return (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 ring-2 ring-pink-100">
              <AvatarImage src={post.author.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 leading-none">
                {post.author.full_name || post.author.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{post.author.username} •{" "}
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="space-y-4">
          {/* Post Content */}
          <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
            <ParsedText content={post.content} />
          </div>

          {/* Post Image */}
          {post.image_url && (
            <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-video max-h-96">
              <Image
                src={post.image_url}
                alt="Post content"
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center space-x-2 h-8 px-2 transition-all duration-200 ${
                  isLiked
                    ? "text-pink-600 hover:text-pink-700 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                    : "text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                }`}
              >
                <Heart
                  className={`h-4 w-4 transition-all duration-200 ${
                    isLiked ? "fill-pink-600 text-pink-600 scale-110" : ""
                  }`}
                />
                <span className="text-sm font-medium">{likesCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCommentToggle}
                className={`flex items-center space-x-2 h-8 px-2 transition-all duration-200 ${
                  commentsOpen
                    ? "text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {post.comments_count}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 h-8 px-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Engagement Badge */}
            {likesCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800 text-xs"
              >
                {likesCount === 1 ? "1 like" : `${likesCount} likes`}
              </Badge>
            )}
          </div>

          {/* Comments Section */}
          <Comments
            postId={post.id}
            currentUserId={currentUserId}
            isOpen={commentsOpen}
            onToggle={handleCommentToggle}
            commentsCount={post.comments_count}
          />
        </div>
      </CardContent>
    </Card>
  );
}
