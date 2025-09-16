"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Comments } from "@/components/Comments";
import { PostActionsMenu } from "@/components/PostActionsMenu";
import { EditPostDialog } from "@/components/EditPostDialog";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { ParsedText } from "@/components/ParsedText";
import { ImageModal } from "@/components/ImageModal";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    image_url?: string;
    created_at: string;
    updated_at?: string;
    author: {
      username: string;
      full_name: string;
      avatar_url?: string;
    };
    author_id?: string;
    likes_count: number;
    comments_count: number;
    user_has_liked: boolean;
    user_has_bookmarked?: boolean;
  };
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onPostUpdate?: (postId: string, newContent: string) => void;
  onPostDelete?: (postId: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onBookmark,
  onPostUpdate,
  onPostDelete,
}: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.user_has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [isBookmarked, setIsBookmarked] = useState(
    post.user_has_bookmarked || false
  );
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [postContent, setPostContent] = useState(post.content);

  // Check if current user is the author
  const isOwner = currentUserId === post.author_id;

  // Sync bookmark state when post prop changes
  useEffect(() => {
    setIsBookmarked(post.user_has_bookmarked || false);
  }, [post.user_has_bookmarked]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.(post.id);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(post.id);
  };

  const handleCommentsCountChange = (newCount: number) => {
    setCommentsCount(newCount);
  };

  const handleCommentToggle = () => {
    setCommentsOpen(!commentsOpen);
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handlePostUpdate = (newContent: string) => {
    setPostContent(newContent);
    onPostUpdate?.(post.id, newContent);
  };

  const handlePostDelete = () => {
    onPostDelete?.(post.id);
  };

  const initials =
    post.author.full_name
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase() || post.author.username[0].toUpperCase();

  // Show edited indicator if post was updated
  const isEdited = post.updated_at && post.updated_at !== post.created_at;

  return (
    <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-pink-100 flex-shrink-0">
              <AvatarImage src={post.author.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100 leading-none text-sm sm:text-base truncate">
                {post.author.full_name || post.author.username}
              </p>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                <span className="truncate">@{post.author.username}</span>
                <span>•</span>
                <span className="whitespace-nowrap">
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
                {isEdited && (
                  <>
                    <span>•</span>
                    <span className="text-pink-600 dark:text-pink-400 whitespace-nowrap">
                      editado
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <PostActionsMenu
              postId={post.id}
              isOwner={isOwner}
              onEdit={handleEdit}
              onDelete={handlePostDelete}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4 px-4 sm:px-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Post Content */}
          <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-sm sm:text-base break-words">
            <ParsedText content={postContent} />
          </div>

          {/* Post Image */}
          {post.image_url && (
            <div
              className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-video max-h-80 sm:max-h-96 cursor-pointer transition-transform duration-200 hover:scale-[1.02] group"
              onClick={() => setImageModalOpen(true)}
            >
              <Image
                src={post.image_url}
                alt="Post content"
                fill
                className="object-cover transition-opacity duration-200 group-hover:opacity-90"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3 transform scale-90 group-hover:scale-100">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center space-x-1 sm:space-x-2 h-7 sm:h-8 px-1 sm:px-2 transition-all duration-200 ${
                  isLiked
                    ? "text-pink-600 hover:text-pink-700 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30"
                    : "text-gray-500 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                }`}
              >
                <Heart
                  className={`h-3 w-3 sm:h-4 sm:w-4 transition-all duration-200 ${
                    isLiked ? "fill-pink-600 text-pink-600 scale-110" : ""
                  }`}
                />
                <span className="text-xs sm:text-sm font-medium">
                  {likesCount}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleCommentToggle}
                className={`flex items-center space-x-2 h-7 sm:h-8 px-1 sm:px-2 transition-all duration-200 ${
                  commentsOpen
                    ? "text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                }`}
              >
                <div className="relative">
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  {commentsOpen && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <span className="text-xs sm:text-sm font-medium">
                  {commentsCount}
                </span>
                {commentsOpen && (
                  <span className="text-xs text-blue-500 font-medium">
                    • Thread
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 sm:space-x-2 h-7 sm:h-8 px-1 sm:px-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
              >
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {/* Bookmark Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className={`h-7 w-7 sm:h-8 sm:w-8 p-0 transition-all duration-200 ${
                isBookmarked
                  ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  : "text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              }`}
              title={isBookmarked ? "Remove bookmark" : "Bookmark post"}
            >
              <Bookmark
                className={`h-3 w-3 sm:h-4 sm:w-4 transition-all duration-200 ${
                  isBookmarked ? "fill-purple-600 dark:fill-purple-400" : ""
                }`}
              />
            </Button>
          </div>

          {/* Comments Section */}
          <Comments
            postId={post.id}
            currentUserId={currentUserId}
            isOpen={commentsOpen}
            commentsCount={commentsCount}
            onCommentsCountChange={handleCommentsCountChange}
          />
        </div>
      </CardContent>

      {/* Image Modal */}
      {post.image_url && (
        <ImageModal
          src={post.image_url}
          alt="Post content"
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          authorName={post.author.full_name || post.author.username}
        />
      )}

      {/* Edit Post Dialog */}
      <EditPostDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        postId={post.id}
        initialContent={post.content}
        onUpdate={handlePostUpdate}
      />
    </Card>
  );
}
