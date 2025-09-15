"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Download, Share2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useImageModal } from "@/hooks/useImageModal";
import { toast } from "sonner";

interface ImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
  authorName?: string;
}

export function ImageModal({
  src,
  alt,
  isOpen,
  onClose,
  authorName,
}: ImageModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [canClose, setCanClose] = useState(false);

  // Use custom hook for modal behavior
  useImageModal(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      // Trigger animation after a brief delay
      setTimeout(() => setIsVisible(true), 10);
      // Allow closing after animation completes
      setTimeout(() => setCanClose(true), 600);
    } else {
      setIsVisible(false);
      setCanClose(false);
      // Reset scale when closing
      setScale(1);
    }
  }, [isOpen]);

  // Handle zoom with mouse wheel
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (!isOpen) return;

      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => Math.max(0.5, Math.min(3, prev + delta)));
    };

    if (isOpen) {
      document.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close if clicking the backdrop (not the image) and can close
      if (e.target === e.currentTarget && canClose) {
        onClose();
      }
    },
    [onClose, canClose]
  );

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Image ${authorName ? `by ${authorName}` : ""}`,
          url: src,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(src);
        toast.success("Image URL copied to clipboard!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        toast.error("Failed to copy URL");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/90 backdrop-blur-md transition-all duration-500 ease-out ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleBackdropClick}
      />

      {/* Modal Content */}
      <div
        className="relative z-10 flex h-full items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div
          className={`relative max-h-[95vh] max-w-[95vw] transform transition-all duration-500 ease-out ${
            isVisible
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-90 opacity-0 translate-y-8"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image Container */}
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
            {/* Loading State */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-3xl">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />
              </div>
            )}

            {/* Image */}
            <div className="relative overflow-hidden">
              <Image
                src={src}
                alt={alt}
                width={800}
                height={600}
                className={`h-auto max-h-[80vh] w-auto max-w-full object-contain transition-transform duration-200 ${
                  scale > 1 ? "cursor-grab" : "cursor-zoom-in"
                } ${isDragging ? "cursor-grabbing" : ""}`}
                style={{ transform: `scale(${scale})` }}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onClick={handleImageClick}
                priority
              />

              {/* Gradient Overlay for Controls */}
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Top Controls */}
            <div className="absolute right-4 top-4 flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-10 w-10 rounded-full bg-black/20 p-0 text-white backdrop-blur-sm hover:bg-black/40 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              {/* Image Info */}
              <div className="text-white">
                {authorName && (
                  <p className="text-sm font-medium drop-shadow-lg">
                    by {authorName}
                  </p>
                )}
                {scale !== 1 && (
                  <p className="text-xs opacity-75 drop-shadow-lg">
                    Zoom: {Math.round(scale * 100)}%
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-10 w-10 rounded-full bg-black/20 p-0 text-white backdrop-blur-sm hover:bg-black/40 hover:text-white"
                  title="Share image"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-10 w-10 rounded-full bg-black/20 p-0 text-white backdrop-blur-sm hover:bg-black/40 hover:text-white"
                  title="Download image"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(src, "_blank")}
                  className="h-10 w-10 rounded-full bg-black/20 p-0 text-white backdrop-blur-sm hover:bg-black/40 hover:text-white"
                  title="Open in new tab"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
