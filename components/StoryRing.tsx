"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

interface StoryRingProps {
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  hasUnviewed?: boolean;
  isOwnStory?: boolean;
  onClick: () => void;
  onAddStoryClick?: () => void;
  isAddStory?: boolean;
}

export function StoryRing({
  author,
  hasUnviewed = false,
  isOwnStory = false,
  onClick,
  onAddStoryClick,
  isAddStory = false,
}: StoryRingProps) {
  const ringColor = hasUnviewed
    ? "bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-500"
    : "bg-gray-300 dark:bg-gray-600";

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddStoryClick) {
      onAddStoryClick();
    }
  };

  if (isAddStory) {
    return (
      <div
        className="flex flex-col items-center space-y-1 cursor-pointer"
        onClick={onClick}
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-400 dark:border-gray-500 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
            <Plus className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
        <span className="text-xs text-center font-medium text-gray-700 dark:text-gray-300 max-w-16 truncate">
          Tu story
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center space-y-1 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        {/* Story ring/border */}
        <div className={`w-16 h-16 rounded-full p-0.5 ${ringColor}`}>
          <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 p-0.5">
            <Avatar className="w-full h-full">
              <AvatarImage src={author.avatar_url} alt={author.full_name} />
              <AvatarFallback className="text-sm font-semibold">
                {author.full_name?.charAt(0)?.toUpperCase() ||
                  author.username?.charAt(0)?.toUpperCase() ||
                  "?"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Plus icon for own story if no stories exist */}
        {isOwnStory && (
          <button
            onClick={handleAddClick}
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 hover:bg-blue-600 transition-colors z-10"
          >
            <Plus className="w-3 h-3 text-white" />
          </button>
        )}
      </div>

      <span className="text-xs text-center font-medium text-gray-700 dark:text-gray-300 max-w-16 truncate">
        {isOwnStory ? "Tu story" : author.username}
      </span>
    </div>
  );
}
