"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  Search,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/useNotifications";
import { Notification } from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface NotificationPageProps {
  onBack?: () => void;
}

export function NotificationPage({ onBack }: NotificationPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState<"all" | "unread">("all");

  const {
    notifications,
    loading,
    counts,
    hasMore,
    typeFilter,
    markAsRead,
    markAllAsRead,
    deleteOne,
    loadMoreNotifications,
    refreshNotifications,
    setTypeFilter,
  } = useNotifications({
    limit: 20,
    realTime: true,
    unreadOnly: currentTab === "unread",
  });

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter notifications based on search
  const filteredNotifications = notifications.filter(
    (notification) =>
      searchQuery === "" ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarkAsRead = async (notificationId: string) => {
    setActionLoading(notificationId);
    await markAsRead(notificationId);
    setActionLoading(null);
  };

  const handleDelete = async (notificationId: string) => {
    setActionLoading(notificationId);
    await deleteOne(notificationId);
    setActionLoading(null);
    setSelectedItems((prev) => prev.filter((id) => id !== notificationId));
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading("all");
    await markAllAsRead();
    setActionLoading(null);
  };

  const handleBulkAction = async (action: "read" | "delete") => {
    if (selectedItems.length === 0) return;

    setActionLoading("bulk");

    if (action === "read") {
      for (const id of selectedItems) {
        await markAsRead(id);
      }
    } else if (action === "delete") {
      for (const id of selectedItems) {
        await deleteOne(id);
      }
    }

    setSelectedItems([]);
    setActionLoading(null);
  };

  const toggleSelectItem = (notificationId: string) => {
    setSelectedItems((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredNotifications.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredNotifications.map((n) => n.id));
    }
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft size={16} />
                </Button>
              )}
              <Bell size={24} />
              <div>
                <CardTitle>Notificaciones</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Mantente al día con toda tu actividad
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshNotifications}
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={cn(loading && "animate-spin")}
                />
                Actualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={
                  actionLoading === "all" || (counts?.unread || 0) === 0
                }
              >
                <CheckCheck size={16} />
                Marcar todo como leído
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{counts.total}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {counts.unread}
              </div>
              <p className="text-sm text-muted-foreground">No leídas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {counts.total - counts.unread}
              </div>
              <p className="text-sm text-muted-foreground">Leídas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {counts.byType.message}
              </div>
              <p className="text-sm text-muted-foreground">Mensajes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Buscar notificaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={typeFilter || "all"}
                onValueChange={(value: string) =>
                  setTypeFilter(
                    value === "all" ? null : (value as Notification["type"])
                  )
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="like_post">Me gusta en posts</SelectItem>
                  <SelectItem value="like_story">
                    Me gusta en stories
                  </SelectItem>
                  <SelectItem value="comment">Comentarios</SelectItem>
                  <SelectItem value="follow">Seguidores</SelectItem>
                  <SelectItem value="message">Mensajes</SelectItem>
                  <SelectItem value="mention">Menciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.length} seleccionada
                    {selectedItems.length !== 1 ? "s" : ""}
                  </span>
                  <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                    {selectedItems.length === filteredNotifications.length
                      ? "Deseleccionar todo"
                      : "Seleccionar todo"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("read")}
                    disabled={actionLoading === "bulk"}
                  >
                    <Check size={16} className="mr-1" />
                    Marcar como leídas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("delete")}
                    disabled={actionLoading === "bulk"}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={currentTab}
        onValueChange={(value: string) =>
          setCurrentTab(value as "all" | "unread")
        }
      >
        <TabsList>
          <TabsTrigger value="all">
            Todas
            {counts && (
              <Badge variant="secondary" className="ml-2">
                {counts.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            No leídas
            {counts && counts.unread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {counts.unread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab} className="space-y-4">
          {/* Notifications List */}
          {loading && notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Bell
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-muted-foreground">
                    Cargando notificaciones...
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Bell
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No se encontraron notificaciones"
                      : "No hay notificaciones"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {searchQuery
                      ? "Intenta con otros términos de búsqueda"
                      : "Te notificaremos cuando algo interesante suceda"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isSelected={selectedItems.includes(notification.id)}
                  onSelect={() => toggleSelectItem(notification.id)}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                  isLoading={actionLoading === notification.id}
                  getIcon={getNotificationIcon}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={loadMoreNotifications}
                disabled={loading}
              >
                Cargar más notificaciones
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  isSelected: boolean;
  onSelect: () => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  getIcon: (type: Notification["type"]) => string;
}

function NotificationItem({
  notification,
  isSelected,
  onSelect,
  onMarkAsRead,
  onDelete,
  isLoading,
  getIcon,
}: NotificationItemProps) {
  const formatTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
      locale: es,
    });
  };

  return (
    <Card
      className={cn(
        "transition-all",
        !notification.is_read &&
          "border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20",
        isSelected && "ring-2 ring-blue-500"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="mt-1"
          />

          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            <span className="text-lg">{getIcon(notification.type)}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium leading-tight">
                  {notification.title}
                </p>
                <p className="text-muted-foreground mt-1 leading-tight">
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">
                    {formatTime(notification.created_at)}
                  </span>
                  {!notification.is_read && (
                    <Badge variant="secondary" className="text-xs">
                      Nueva
                    </Badge>
                  )}
                  {notification.actor && (
                    <span className="text-sm text-muted-foreground">
                      por{" "}
                      {notification.actor.full_name ||
                        notification.actor.username}
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
                    <Settings size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.is_read && (
                    <DropdownMenuItem
                      onClick={() => onMarkAsRead(notification.id)}
                      disabled={isLoading}
                    >
                      <Check size={14} className="mr-2" />
                      Marcar como leído
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
      </CardContent>
    </Card>
  );
}
