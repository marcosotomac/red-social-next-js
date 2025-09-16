"use client";

import { Conversation } from "@/lib/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
        <div className="p-6 border-b border-white/20 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Mensajes
            </h2>
            <Button
              size="icon"
              variant="ghost"
              className="hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-full"
            >
              <Plus className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </Button>
          </div>
        </div>

        {/* Loading conversations */}
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-xl animate-pulse backdrop-blur-sm bg-white/40 dark:bg-gray-800/40"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg" />
                <div className="w-1/2 h-3 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg" />
              </div>
              <div className="w-8 h-3 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: '100%' }}>
      {/* Header */}
      <div className="p-4 border-b border-white/20 dark:border-gray-700/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Mensajes
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onNewChat}
            className="hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-full transition-all duration-200 h-8 w-8"
          >
            <Plus className="h-4 w-4 text-pink-600 dark:text-pink-400" />
          </Button>
        </div>
      </div>

      {/* Conversations list - Optimized scroll area */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <ScrollArea className="h-full">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3 min-h-[250px]">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full mx-auto flex items-center justify-center shadow-lg">
                <MessageCircle className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                  No hay conversaciones
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs leading-relaxed">
                  Comienza una nueva conversación para empezar a chatear.
                </p>
              </div>
              <Button
                onClick={onNewChat}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-lg text-xs px-3 py-1 h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Nueva conversación
              </Button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conversation) => (
                <Button
                  key={conversation.id}
                  variant="ghost"
                  className={cn(
                    "w-full h-auto p-4 justify-start rounded-xl transition-all duration-200",
                    "hover:bg-white/60 dark:hover:bg-gray-800/60 hover:shadow-md backdrop-blur-sm",
                    selectedConversationId === conversation.id &&
                    "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 shadow-md border border-pink-200/50 dark:border-pink-700/30"
                )}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-white/50 shadow-sm">
                      <AvatarImage
                        src={getConversationAvatar(conversation) || undefined}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-sm font-semibold">
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
                      <h4 className="font-medium truncate text-gray-900 dark:text-gray-100">
                        {getConversationTitle(conversation)}
                      </h4>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {conversation.last_message && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatLastMessageTime(
                              conversation.last_message.created_at
                            )}
                          </span>
                        )}

                        {conversation.unread_count > 0 && (
                          <Badge
                            variant="default"
                            className="h-5 min-w-[20px] text-xs bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 shadow-lg"
                          >
                            {conversation.unread_count > 99
                              ? "99+"
                              : conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {getLastMessagePreview(conversation)}
                    </p>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
        </ScrollArea>
      </div>
    </div>
  );
}
