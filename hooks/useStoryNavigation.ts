"use client";

import { useState, useCallback } from "react";
import { StoryGroup } from "@/lib/stories";

interface UseStoryNavigationProps {
  storyGroups: StoryGroup[];
}

export function useStoryNavigation({ storyGroups }: UseStoryNavigationProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStories = currentGroup?.stories || [];

  const openStoryViewer = useCallback(
    (authorId: string) => {
      // Find the group index
      const groupIndex = storyGroups.findIndex(
        (group) => group.author.id === authorId
      );
      if (groupIndex === -1) return;

      setCurrentGroupIndex(groupIndex);
      setCurrentStoryIndex(0);
      setIsViewerOpen(true);
    },
    [storyGroups]
  );

  const closeStoryViewer = useCallback(() => {
    setIsViewerOpen(false);
    setCurrentGroupIndex(0);
    setCurrentStoryIndex(0);
  }, []);

  const goToNextStory = useCallback(() => {
    if (!currentGroup) return;

    // If there's a next story in current group
    if (currentStoryIndex < currentStories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    }
    // If there's a next group
    else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
    }
    // No more stories, close viewer
    else {
      closeStoryViewer();
    }
  }, [
    currentGroup,
    currentStoryIndex,
    currentStories.length,
    currentGroupIndex,
    storyGroups.length,
    closeStoryViewer,
  ]);

  const goToPreviousStory = useCallback(() => {
    if (!currentGroup) return;

    // If there's a previous story in current group
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    }
    // If there's a previous group
    else if (currentGroupIndex > 0) {
      const previousGroup = storyGroups[currentGroupIndex - 1];
      setCurrentGroupIndex((prev) => prev - 1);
      setCurrentStoryIndex(previousGroup.stories.length - 1); // Go to last story of previous group
    }
    // Already at the beginning, do nothing or close
  }, [currentGroup, currentStoryIndex, currentGroupIndex, storyGroups]);

  const goToStory = useCallback(
    (groupIndex: number, storyIndex: number) => {
      if (groupIndex >= 0 && groupIndex < storyGroups.length) {
        const group = storyGroups[groupIndex];
        if (storyIndex >= 0 && storyIndex < group.stories.length) {
          setCurrentGroupIndex(groupIndex);
          setCurrentStoryIndex(storyIndex);
        }
      }
    },
    [storyGroups]
  );

  return {
    // State
    isViewerOpen,
    currentGroupIndex,
    currentStoryIndex,
    currentGroup,
    currentStories,

    // Actions
    openStoryViewer,
    closeStoryViewer,
    goToNextStory,
    goToPreviousStory,
    goToStory,
  };
}
