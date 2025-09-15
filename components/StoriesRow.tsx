"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoryRing } from "@/components/StoryRing";
import { getStoriesGroupedByAuthor, StoryGroup } from "@/lib/stories";
import { createClient } from "@/lib/supabase/client";

interface StoriesRowProps {
  currentUserId?: string;
  onStoryClick: (authorId: string, stories: StoryGroup) => void;
  onAddStoryClick: () => void;
}

export function StoriesRow({
  currentUserId,
  onStoryClick,
  onAddStoryClick,
}: StoriesRowProps) {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  } | null>(null);

  useEffect(() => {
    const fetchStoriesAndProfile = async () => {
      try {
        // Fetch current user profile
        if (currentUserId) {
          const supabase = createClient();
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .eq("id", currentUserId)
            .single();

          setCurrentUserProfile(profile);
        }

        // Fetch stories
        const stories = await getStoriesGroupedByAuthor(currentUserId);
        setStoryGroups(stories);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoriesAndProfile();
  }, [currentUserId]);

  const handleStoryClick = (storyGroup: StoryGroup) => {
    onStoryClick(storyGroup.author.id, storyGroup);
  };

  const handleAddStoryClick = () => {
    onAddStoryClick();
  };

  // Check if current user has stories
  const userHasStories = storyGroups.some(
    (group) => group.author.id === currentUserId
  );

  if (loading) {
    return (
      <div className="py-4">
        <ScrollArea className="w-full">
          <div className="flex space-x-4 px-4">
            {/* Loading skeletons */}
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex flex-col items-center space-y-1">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  const hasAnyStories = storyGroups.length > 0;

  return (
    <div className="py-4 border-b border-gray-200 dark:border-gray-700">
      <ScrollArea className="w-full">
        <div className="flex space-x-4 px-4">
          {/* Add Story Button - Always first if user is logged in */}
          {currentUserId && currentUserProfile && (
            <>
              {!userHasStories ? (
                <StoryRing
                  author={currentUserProfile}
                  isAddStory={true}
                  onClick={handleAddStoryClick}
                />
              ) : (
                // If user has stories, show them first with add button
                storyGroups
                  .filter((group) => group.author.id === currentUserId)
                  .map((group) => (
                    <StoryRing
                      key={group.author.id}
                      author={group.author}
                      hasUnviewed={group.has_unviewed}
                      isOwnStory={true}
                      onClick={() => handleStoryClick(group)}
                    />
                  ))
              )}
            </>
          )}

          {/* Other users' stories */}
          {storyGroups
            .filter((group) => group.author.id !== currentUserId)
            .map((group) => (
              <StoryRing
                key={group.author.id}
                author={group.author}
                hasUnviewed={group.has_unviewed}
                onClick={() => handleStoryClick(group)}
              />
            ))}

          {/* Empty state if no stories */}
          {!hasAnyStories && !currentUserId && (
            <div className="flex items-center justify-center w-full py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No hay stories disponibles
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
