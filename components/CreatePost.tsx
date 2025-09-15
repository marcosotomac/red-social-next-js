"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { ImageIcon, Smile, MapPin, Calendar, X } from "lucide-react";

interface CreatePostProps {
  user: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  onPost?: (content: string, imageUrl?: string) => void;
}

export function CreatePost({ user, onPost }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsPosting(true);
    try {
      await onPost?.(content, imageUrl || undefined);
      setContent("");
      setImageUrl(null);
      setShowImageUpload(false);
    } catch (error) {
      console.error("Error posting:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const initials =
    user.full_name
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase() || user.username[0].toUpperCase();

  const remainingChars = 500 - content.length;

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-lg rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 ring-2 ring-pink-100">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900 leading-none">
              {user.full_name || user.username}
            </p>
            <p className="text-sm text-gray-500">
              Share what&apos;s on your mind
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Textarea
          placeholder="What's happening in your gentle world? ✨"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-24 border-0 bg-gray-50 resize-none focus:bg-white transition-colors placeholder:text-gray-400"
          maxLength={500}
        />

        {/* Image Upload Section */}
        {showImageUpload && (
          <ImageUpload
            bucket="post-images"
            currentImage={imageUrl || undefined}
            onUploadComplete={(url) => setImageUrl(url)}
            onRemove={() => setImageUrl(null)}
            className="mb-4"
          />
        )}

        {/* Character Counter */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4 text-gray-500">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImageUpload(!showImageUpload)}
              className={`h-8 w-8 p-0 transition-colors ${
                showImageUpload
                  ? "bg-pink-50 text-pink-600"
                  : "hover:bg-pink-50 hover:text-pink-600"
              }`}
            >
              {showImageUpload ? (
                <X className="h-4 w-4" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
            >
              <MapPin className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600"
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>

          <span
            className={`text-sm ${
              remainingChars < 50
                ? "text-orange-500"
                : remainingChars < 20
                ? "text-red-500"
                : "text-gray-400"
            }`}
          >
            {remainingChars}
          </span>
        </div>

        {/* Post Button */}
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isPosting}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50"
          >
            {isPosting ? "Sharing..." : "Share with kindness"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
