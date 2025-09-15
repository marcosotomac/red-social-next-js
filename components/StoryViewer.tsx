"use client";

import { useEffect, useState, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Download,
  Share2,
  Bookmark,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Story,
  markStoryAsViewed,
  toggleStoryLike,
  saveStoryAsHighlight,
} from "@/lib/stories";
import Image from "next/image";
import { toast } from "sonner";

interface StoryViewerProps {
  stories: Story[];
  currentStoryIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  currentUserId?: string;
}

export function StoryViewer({
  stories,
  currentStoryIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  currentUserId,
}: StoryViewerProps) {
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentStoryIndex];
  const isOwnStory = currentStory?.author_id === currentUserId;

  // Reset progress and liked state when story changes
  useEffect(() => {
    if (currentStory) {
      setProgress(0);
      setIsLiked(currentStory.user_has_liked || false);
      setIsLoading(true);

      // Mark story as viewed
      if (!isOwnStory) {
        markStoryAsViewed(currentStory.id);
      }
    }
  }, [currentStory, isOwnStory]);

  // Progress bar and auto-advance logic
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused || isLoading) return;

    const duration = currentStory.duration * 1000; // Convert to milliseconds
    const interval = 50; // Update every 50ms for smooth progress
    const increment = (interval / duration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          // Auto advance to next story
          if (currentStoryIndex < stories.length - 1) {
            onNext();
          } else {
            onClose();
          }
          return 100;
        }
        return newProgress;
      });
    }, interval);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [
    isOpen,
    currentStory,
    isPaused,
    isLoading,
    currentStoryIndex,
    stories.length,
    onNext,
    onClose,
  ]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onPrevious();
          break;
        case "ArrowRight":
          onNext();
          break;
        case " ":
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleLike = async () => {
    if (!currentStory) return;

    try {
      const result = await toggleStoryLike(currentStory.id);
      if (result.success) {
        setIsLiked(result.isLiked);
        // Optionally show a toast or animation
      }
    } catch (error) {
      console.error("Error toggling story like:", error);
      toast.error("Error al dar like a la story");
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleShare = async () => {
    if (navigator.share && currentStory) {
      try {
        await navigator.share({
          title: `Story de ${currentStory.author.full_name}`,
          text: currentStory.content || undefined,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  const handleDownload = async () => {
    if (!currentStory) return;

    try {
      const response = await fetch(currentStory.media_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `story-${currentStory.id}.${
        currentStory.media_type === "video" ? "mp4" : "jpg"
      }`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Story descargada");
    } catch (error) {
      console.error("Error downloading story:", error);
      toast.error("Error al descargar la story");
    }
  };

  const handleSaveAsHighlight = async () => {
    if (!currentStory || !isOwnStory) return;

    const title = prompt("Nombre para esta colección de destacados:");
    if (!title) return;

    try {
      const result = await saveStoryAsHighlight(currentStory.id, title);
      if (result.success) {
        toast.success("Story guardada en destacados");
      } else {
        toast.error(result.error || "Error al guardar en destacados");
      }
    } catch (error) {
      console.error("Error saving as highlight:", error);
      toast.error("Error al guardar en destacados");
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Left third of screen: previous story
    if (x < width / 3) {
      onPrevious();
    }
    // Right two-thirds: next story
    else {
      onNext();
    }
  };

  if (!isOpen || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="flex space-x-1">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-300 ease-linear"
                style={{
                  width:
                    index < currentStoryIndex
                      ? "100%"
                      : index === currentStoryIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between pt-4">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={currentStory.author.avatar_url} />
            <AvatarFallback className="text-xs">
              {currentStory.author.full_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="text-white">
            <p className="font-semibold text-sm">
              {currentStory.author.username}
            </p>
            <p className="text-xs text-white/70">
              {new Date(currentStory.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isOwnStory ? (
            // Own story options
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-2 h-auto"
              onClick={handleSaveAsHighlight}
            >
              <Bookmark className="w-5 h-5" />
            </Button>
          ) : (
            // Other users' story options
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2 h-auto"
                onClick={handleLike}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isLiked ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2 h-auto"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2 h-auto"
                onClick={handleDownload}
              >
                <Download className="w-5 h-5" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 p-2 h-auto"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Navigation buttons */}
      {currentStoryIndex > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 text-white hover:bg-white/20 p-2 h-auto"
          onClick={onPrevious}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}

      {currentStoryIndex < stories.length - 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 text-white hover:bg-white/20 p-2 h-auto"
          onClick={onNext}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      )}

      {/* Story content */}
      <div
        className="w-full h-full flex items-center justify-center cursor-pointer"
        onClick={handleTap}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {currentStory.media_type === "image" ? (
          <div className="relative w-full h-full">
            <Image
              src={currentStory.media_url}
              alt="Story"
              fill
              className="object-contain"
              onLoad={handleImageLoad}
              priority
            />
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <video
            src={currentStory.media_url}
            className="w-full h-full object-contain"
            autoPlay
            muted
            onLoadedData={handleImageLoad}
            onEnded={onNext}
          />
        )}

        {/* Text content overlay */}
        {currentStory.content && (
          <div className="absolute bottom-20 left-4 right-4 z-10">
            <p className="text-white text-lg font-medium text-center bg-black/30 p-4 rounded-lg backdrop-blur-sm">
              {currentStory.content}
            </p>
          </div>
        )}
      </div>

      {/* Stats overlay for own stories */}
      {isOwnStory && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
            <div className="flex justify-between items-center text-sm">
              <span>{currentStory.views_count} visualizaciones</span>
              <span>{currentStory.likes_count} likes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
