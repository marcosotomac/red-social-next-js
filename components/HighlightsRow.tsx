"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { getUserHighlights, Story } from "@/lib/stories";
import Image from "next/image";

interface HighlightsRowProps {
  userId: string;
  onHighlightClick: (stories: Story[]) => void;
}

export function HighlightsRow({
  userId,
  onHighlightClick,
}: HighlightsRowProps) {
  const [highlights, setHighlights] = useState<{ [title: string]: Story[] }>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        const userHighlights = await getUserHighlights(userId);
        setHighlights(userHighlights);
      } catch (error) {
        console.error("Error fetching highlights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHighlights();
  }, [userId]);

  const handleHighlightClick = (stories: Story[]) => {
    onHighlightClick(stories);
  };

  if (loading) {
    return (
      <div className="py-4">
        <div className="flex space-x-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const highlightTitles = Object.keys(highlights);

  if (highlightTitles.length === 0) {
    return null; // Don't show anything if no highlights
  }

  return (
    <div className="py-4">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 px-4">
        Destacados
      </h3>
      <div className="flex space-x-4 px-4 overflow-x-auto">
        {highlightTitles.map((title) => {
          const stories = highlights[title];
          const coverStory = stories[0]; // Use first story as cover

          return (
            <div
              key={title}
              className="flex flex-col items-center space-y-2 cursor-pointer flex-shrink-0"
              onClick={() => handleHighlightClick(stories)}
            >
              <div className="relative">
                {/* Highlight cover */}
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                  {coverStory.media_type === "image" ? (
                    <Image
                      src={coverStory.media_url}
                      alt={title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Story count indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                  <span className="text-xs text-white font-medium">
                    {stories.length}
                  </span>
                </div>
              </div>

              <span className="text-xs text-center font-medium text-gray-700 dark:text-gray-300 max-w-16 truncate">
                {title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
