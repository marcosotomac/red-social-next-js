"use client";

import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function OnlineIndicator({
  isOnline,
  size = "sm",
  className,
}: OnlineIndicatorProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "rounded-full border-2 border-background",
          sizeClasses[size],
          isOnline ? "bg-green-500" : "bg-gray-400"
        )}
      />
      {isOnline && (
        <div
          className={cn(
            "absolute top-0 left-0 rounded-full bg-green-500 animate-ping",
            sizeClasses[size]
          )}
        />
      )}
    </div>
  );
}
