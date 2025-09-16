"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotificationCounts } from "@/hooks/useNotifications";
import { NotificationDropdown } from "./notification-dropdown";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
  showDropdown?: boolean;
  iconSize?: number;
  variant?: "default" | "ghost" | "outline";
  animate?: boolean;
}

export function NotificationBell({
  className,
  showDropdown = true,
  iconSize = 20,
  variant = "ghost",
  animate = true,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [wasRecentlyUpdated, setWasRecentlyUpdated] = useState(false);
  const { counts, loading } = useNotificationCounts();
  const previousUnreadCount = useRef<number>(0);

  const unreadCount = counts?.unread || 0;
  const hasUnread = unreadCount > 0;

  // Animation for new notifications
  useEffect(() => {
    if (
      animate &&
      unreadCount > previousUnreadCount.current &&
      previousUnreadCount.current > 0
    ) {
      setWasRecentlyUpdated(true);
      const timer = setTimeout(() => setWasRecentlyUpdated(false), 2000);
      return () => clearTimeout(timer);
    }
    previousUnreadCount.current = unreadCount;
  }, [unreadCount, animate]);

  // Format unread count for display
  const formatCount = (count: number) => {
    if (count > 99) return "99+";
    return count.toString();
  };

  const BellIcon = hasUnread ? BellRing : Bell;

  const bellButton = (
    <Button
      variant={variant}
      size="sm"
      className={cn(
        "relative p-2 rounded-full transition-all duration-200",
        "hover:bg-pink-50 dark:hover:bg-pink-900/20",
        "hover:shadow-lg hover:shadow-pink-200/50 dark:hover:shadow-pink-900/20",
        hasUnread && "text-pink-600 dark:text-pink-400",
        !hasUnread && "text-gray-600 dark:text-gray-400",
        wasRecentlyUpdated && animate && "animate-pulse",
        loading && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={loading}
    >
      <BellIcon
        size={iconSize}
        className={cn(
          "transition-all duration-300",
          hasUnread && "fill-current drop-shadow-sm",
          wasRecentlyUpdated && animate && "animate-bounce"
        )}
      />

      {/* Unread count badge */}
      {hasUnread && (
        <Badge
          className={cn(
            "absolute -top-1 -right-1 h-5 min-w-[20px] text-xs font-semibold",
            "flex items-center justify-center p-0",
            "bg-gradient-to-r from-pink-500 to-purple-600 text-white",
            "border-2 border-white dark:border-gray-900",
            "shadow-lg shadow-pink-200/50 dark:shadow-pink-900/30",
            "rounded-full",
            wasRecentlyUpdated && animate && "animate-pulse scale-110"
          )}
        >
          {formatCount(unreadCount)}
        </Badge>
      )}



      {/* Subtle glow effect for unread notifications */}
      {hasUnread && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/20 to-purple-500/20 blur-sm -z-10" />
      )}
    </Button>
  );

  // If dropdown is disabled, return just the button
  if (!showDropdown) {
    return bellButton;
  }

  // Return button with popover dropdown
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{bellButton}</PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-80 p-0 border-0",
          "bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg",
          "shadow-2xl shadow-pink-200/20 dark:shadow-pink-900/20",
          "ring-1 ring-white/20 dark:ring-gray-700/30",
          "rounded-2xl"
        )}
        align="end"
        sideOffset={8}
        onOpenAutoFocus={(e: Event) => e.preventDefault()}
      >
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

// Compact version for smaller spaces
export function NotificationBellCompact({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  const { counts, loading } = useNotificationCounts();
  const unreadCount = counts?.unread || 0;
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "relative p-2 rounded-full transition-all duration-200",
        "hover:bg-pink-50 dark:hover:bg-pink-900/20",
        "hover:shadow-md hover:shadow-pink-200/30 dark:hover:shadow-pink-900/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <Bell
        size={18}
        className={cn(
          "transition-colors duration-200",
          hasUnread
            ? "text-pink-600 dark:text-pink-400 fill-current"
            : "text-gray-600 dark:text-gray-400"
        )}
      />
      {hasUnread && (
        <span
          className={cn(
            "absolute -top-1 -right-1 h-4 w-4 rounded-full",
            "bg-gradient-to-r from-pink-500 to-purple-600 text-white",
            "text-xs font-semibold flex items-center justify-center",
            "border border-white dark:border-gray-900",
            "shadow-lg shadow-pink-200/50 dark:shadow-pink-900/30"
          )}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}

      {/* Subtle glow effect */}
      {hasUnread && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400/10 to-purple-500/10 blur-sm -z-10" />
      )}
    </button>
  );
}
