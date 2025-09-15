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
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full" />
              <div className="w-32 h-4 bg-muted rounded" />
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            <Avatar className="h-10 w-10">
              <AvatarImage src={getConversationAvatar() || undefined} />
              <AvatarFallback>{getConversationInitials()}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h3 className="font-semibold">{getConversationTitle()}</h3>
              {conversation.is_group && (
                <p className="text-sm text-muted-foreground">
                  {conversation.participants?.length || 0} miembros
                </p>
              )}
            </div>
          </div>

          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No hay mensajes aún.</p>
              <p className="text-sm">¡Sé el primero en enviar un mensaje!</p>
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
                  {showDateDivider && <DateDivider date={message.created_at} />}
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
              <div className="bg-primary/50 text-primary-foreground px-3 py-2 rounded-lg text-sm">
                Enviando...
              </div>
            </div>
          )}

          {/* Typing indicator */}
          <TypingIndicator typingUsers={typingUsers} />

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

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
