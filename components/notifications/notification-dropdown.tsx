"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Check,
  MoreHorizontal,
  Trash2,
  Mail,
  ExternalLink,
  Bell,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { Notification } from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface NotificationDropdownProps {
  onClose?: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const {
    notifications,
    loading,
    counts,
    markAsRead,
    markAllAsRead,
    deleteOne,
    refreshNotifications,
  } = useNotifications({
    limit: 10,
    realTime: true,
    unreadOnly: false,
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleMarkAsRead = async (notificationId: string) => {
    setActionLoading(notificationId);
    await markAsRead(notificationId);
    setActionLoading(null);
  };

  const handleDelete = async (notificationId: string) => {
    setActionLoading(notificationId);
    await deleteOne(notificationId);
    setActionLoading(null);
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading("all");
    await markAllAsRead();
    setActionLoading(null);
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "like_post":
        return "❤️";
      case "like_story":
        return "💖";
      case "comment":
        return "💬";
      case "follow":
        return "👤";
      case "message":
        return "📩";
      case "mention":
        return "📢";
      default:
        return "🔔";
    }
  };

  const formatNotificationTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
      locale: es,
    });
  };

  const unreadCount = counts?.unread || 0;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell size={18} />
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="text-sm text-muted-foreground">
              ({unreadCount} nuevas)
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading === "all"}
              className="text-xs"
            >
              {actionLoading === "all" ? "..." : "Marcar todo como leído"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              refreshNotifications();
            }}
            disabled={loading}
          >
            <Settings size={14} />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[400px]">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Bell size={48} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Cargando notificaciones...
              </p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Bell size={48} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No hay notificaciones</p>
              <p className="text-sm text-muted-foreground mt-1">
                Te notificaremos cuando algo interesante suceda
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                isLoading={actionLoading === notification.id}
                formatTime={formatNotificationTime}
                getIcon={getNotificationIcon}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onClose?.();
                // TODO: Navigate to notifications page
              }}
            >
              Ver todas las notificaciones
              <ExternalLink size={14} className="ml-2" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  formatTime: (date: string) => string;
  getIcon: (type: Notification["type"]) => string;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  isLoading,
  formatTime,
  getIcon,
}: NotificationItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors",
        !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
      )}
    >
      {/* Notification Icon */}
      <div className="flex-shrink-0 mt-1">
        <span className="text-lg">{getIcon(notification.type)}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-medium text-sm leading-tight">
              {notification.title}
            </p>
            <p className="text-sm text-muted-foreground mt-1 leading-tight">
              {notification.message}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                {formatTime(notification.created_at)}
              </span>
              {!notification.is_read && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Nueva
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={isLoading}
              >
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!notification.is_read ? (
                <DropdownMenuItem
                  onClick={() => onMarkAsRead(notification.id)}
                  disabled={isLoading}
                >
                  <Check size={14} className="mr-2" />
                  Marcar como leído
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled>
                  <Mail size={14} className="mr-2" />
                  Marcar como no leído
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(notification.id)}
                disabled={isLoading}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 size={14} className="mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="flex-shrink-0 mt-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
        </div>
      )}
    </div>
  );
}
