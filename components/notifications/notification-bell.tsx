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
  animate = true
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [wasRecentlyUpdated, setWasRecentlyUpdated] = useState(false);
  const { counts, loading } = useNotificationCounts();
  const previousUnreadCount = useRef<number>(0);

  const unreadCount = counts?.unread || 0;
  const hasUnread = unreadCount > 0;

  // Animation for new notifications
  useEffect(() => {
    if (animate && unreadCount > previousUnreadCount.current && previousUnreadCount.current > 0) {
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
        "relative p-2",
        hasUnread && "text-blue-600 dark:text-blue-400",
        wasRecentlyUpdated && animate && "animate-pulse",
        className
      )}
      disabled={loading}
    >
      <BellIcon 
        size={iconSize} 
        className={cn(
          "transition-all duration-200",
          hasUnread && "fill-current",
          wasRecentlyUpdated && animate && "animate-bounce"
        )} 
      />
      
      {/* Unread count badge */}
      {hasUnread && (
        <Badge
          variant="destructive"
          className={cn(
            "absolute -top-1 -right-1 h-5 min-w-[20px] text-xs flex items-center justify-center p-0 border-2 border-background",
            wasRecentlyUpdated && animate && "animate-pulse scale-110"
          )}
        >
          {formatCount(unreadCount)}
        </Badge>
      )}
      
      {/* Pulse dot for new notifications */}
      {hasUnread && animate && (
        <span className="absolute -top-1 -right-1 h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        </span>
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
      <PopoverTrigger asChild>
        {bellButton}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end" 
        sideOffset={5}
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
  onClick
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
        "relative p-1 rounded-full hover:bg-accent transition-colors",
        className
      )}
    >
      <Bell 
        size={18} 
        className={cn(
          hasUnread && "text-blue-600 dark:text-blue-400 fill-current"
        )} 
      />
      {hasUnread && (
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}