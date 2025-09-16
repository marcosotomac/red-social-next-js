"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { Conversation } from "@/lib/chat";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { DateDivider } from "./DateDivider";
import { shouldShowDateDivider } from "@/lib/timeUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
  className?: string;
}

export function ChatWindow({
  conversation,
  onBack,
  className,
}: ChatWindowProps) {
  const { messages, loading, sendingMessage, sendMessage } = useChat(
    conversation.id
  );
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    conversation.id
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, [supabase]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get conversation title and participants info
  const getConversationTitle = () => {
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

  const getConversationAvatar = () => {
    if (conversation.is_group) {
      return null; // Could return a group icon or combined avatars
    }

    // Check if participants exist and is an array
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

  const getConversationInitials = () => {
    const title = getConversationTitle();
    return title
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const handleSendMessage = async (
    content: string,
    messageType?: "text" | "image" | "file",
    fileUrl?: string
  ) => {
    await sendMessage(content, messageType, fileUrl);
  };

  if (loading) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="p-6 border-b border-white/20 dark:border-gray-700/30">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </Button>
            )}
            <div className="animate-pulse flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full" />
              <div className="w-32 h-4 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-pink-200 dark:border-pink-700 border-t-pink-600 dark:border-t-pink-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/20 dark:border-gray-700/30 backdrop-blur-sm bg-white/40 dark:bg-gray-800/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </Button>
            )}

            <Avatar className="h-12 w-12 ring-2 ring-white/50 shadow-lg">
              <AvatarImage src={getConversationAvatar() || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-semibold">
                {getConversationInitials()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {getConversationTitle()}
              </h3>
              {conversation.is_group && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {conversation.participants?.length || 0} miembros
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-full transition-all duration-200"
          >
            <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-full mx-auto flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    No hay mensajes aún
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    ¡Sé el primero en enviar un mensaje!
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwnMessage = message.sender_id === currentUserId;
                const previousMessage = messages[index - 1];
                const showAvatar =
                  !previousMessage ||
                  previousMessage.sender_id !== message.sender_id ||
                  new Date(message.created_at).getTime() -
                    new Date(previousMessage.created_at).getTime() >
                    300000; // 5 minutes

                const showDateDivider = shouldShowDateDivider(
                  message.created_at,
                  previousMessage?.created_at
                );

                return (
                  <div key={message.id}>
                    {showDateDivider && (
                      <DateDivider date={message.created_at} />
                    )}
                    <MessageBubble
                      message={message}
                      isOwnMessage={isOwnMessage}
                      showAvatar={showAvatar}
                    />
                  </div>
                );
              })
            )}

            {sendingMessage && (
              <div className="flex justify-end">
                <div className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-4 py-2 rounded-2xl text-sm shadow-lg animate-pulse">
                  Enviando...
                </div>
              </div>
            )}

            {/* Typing indicator */}
            <TypingIndicator typingUsers={typingUsers} />

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onStartTyping={startTyping}
        onStopTyping={stopTyping}
        disabled={sendingMessage}
        placeholder="Escribe un mensaje..."
      />
    </div>
  );
}
