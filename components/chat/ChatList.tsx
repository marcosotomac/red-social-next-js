"use client";

import { Conversation } from "@/lib/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatConversationTime } from "@/lib/timeUtils";
import { MessageCircle, Plus } from "lucide-react";
import { OnlineIndicator } from "./OnlineIndicator";

interface ChatListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onNewChat: () => void;
  loading?: boolean;
  currentUserId?: string;
}

export function ChatList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewChat,
  loading = false,
  currentUserId,
}: ChatListProps) {
  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) {
      return conversation.title;
    }

    if (conversation.is_group) {
      const participantCount = conversation.participants?.length || 0;
      return `Grupo (${participantCount} miembros)`;
    }

    // For direct messages, show the other person's name
    if (
      !conversation.participants ||
      !Array.isArray(conversation.participants)
    ) {
      return "Conversación";
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== currentUserId
    );
    return otherParticipant?.user?.full_name || "Conversación";
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.is_group) {
      return null; // Could return a group icon
    }

    if (
      !conversation.participants ||
      !Array.isArray(conversation.participants)
    ) {
      return null;
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== currentUserId
    );
    return otherParticipant?.user?.avatar_url;
  };

  const getConversationInitials = (conversation: Conversation) => {
    const title = getConversationTitle(conversation);
    return title
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const formatLastMessageTime = (timestamp: string) => {
    return formatConversationTime(timestamp);
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.last_message) {
      return "No hay mensajes";
    }

    const message = conversation.last_message;
    const isOwnMessage = message.sender_id === currentUserId;
    const prefix = isOwnMessage ? "Tú: " : "";

    if (message.message_type === "image") {
      return `${prefix}📷 Imagen`;
    }

    if (message.message_type === "file") {
      return `${prefix}📎 Archivo`;
    }

    const content =
      message.content.length > 50
        ? `${message.content.substring(0, 50)}...`
        : message.content;

    return `${prefix}${content}`;
  };

  if (loading) {
    return (
      <div className="h-full">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mensajes</h2>
            <Button size="icon" variant="ghost">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loading conversations */}
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg animate-pulse"
            >
              <div className="w-12 h-12 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-muted rounded" />
                <div className="w-1/2 h-3 bg-muted rounded" />
              </div>
              <div className="w-8 h-3 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mensajes</h2>
          <Button size="icon" variant="ghost" onClick={onNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No hay conversaciones</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comienza una nueva conversación para empezar a chatear.
            </p>
            <Button onClick={onNewChat}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva conversación
            </Button>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant="ghost"
                className={cn(
                  "w-full h-auto p-3 justify-start rounded-lg mb-1",
                  "hover:bg-muted/50 transition-colors",
                  selectedConversationId === conversation.id && "bg-muted"
                )}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={getConversationAvatar(conversation) || undefined}
                      />
                      <AvatarFallback className="text-sm">
                        {getConversationInitials(conversation)}
                      </AvatarFallback>
                    </Avatar>

                    {!conversation.is_group && (
                      <OnlineIndicator
                        isOnline={false} // Will be implemented with presence hook
                        className="absolute -bottom-1 -right-1"
                      />
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium truncate">
                        {getConversationTitle(conversation)}
                      </h4>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {conversation.last_message && (
                          <span className="text-xs text-muted-foreground">
                            {formatLastMessageTime(
                              conversation.last_message.created_at
                            )}
                          </span>
                        )}

                        {conversation.unread_count > 0 && (
                          <Badge
                            variant="default"
                            className="h-5 min-w-[20px] text-xs"
                          >
                            {conversation.unread_count > 99
                              ? "99+"
                              : conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground truncate">
                      {getLastMessagePreview(conversation)}
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
