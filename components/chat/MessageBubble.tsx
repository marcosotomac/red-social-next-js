"use client";

import { Message } from "@/lib/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatMessageTime } from "@/lib/timeUtils";
import { Check, CheckCheck } from "lucide-react";
import Image from "next/image";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  isRead?: boolean;
}

export function MessageBubble({
  message,
  isOwnMessage,
  showAvatar = true,
  isRead,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-3 max-w-[80%]",
        isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {showAvatar && !isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.sender.avatar_url} />
          <AvatarFallback>
            {message.sender.full_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex flex-col",
          isOwnMessage ? "items-end" : "items-start"
        )}
      >
        {!isOwnMessage && showAvatar && (
          <span className="text-xs text-muted-foreground mb-1">
            {message.sender.full_name}
          </span>
        )}

        <div
          className={cn(
            "rounded-lg px-3 py-2 max-w-full break-words",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {message.message_type === "text" && (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}

          {message.message_type === "image" && (
            <div className="space-y-2">
              {message.content && (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              {message.file_url && (
                <div
                  className="relative rounded overflow-hidden"
                  style={{ maxHeight: "300px", maxWidth: "100%" }}
                >
                  <Image
                    src={message.file_url}
                    alt="Shared image"
                    width={400}
                    height={300}
                    className="rounded max-w-full h-auto object-cover"
                    style={{ maxHeight: "300px" }}
                  />
                </div>
              )}
            </div>
          )}

          {message.message_type === "file" && (
            <div className="space-y-2">
              {message.content && (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              {message.file_url && (
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline hover:no-underline flex items-center gap-1"
                >
                  📎 Descargar archivo
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <span>{formatMessageTime(message.created_at)}</span>
          {message.edited_at && <span className="italic">(editado)</span>}
          {isOwnMessage && (
            <div className="ml-1">
              {isRead ? (
                <CheckCheck className="h-3 w-3 text-blue-500" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>

      {showAvatar && isOwnMessage && (
        <div className="w-8 flex-shrink-0" /> // Spacer for alignment
      )}
    </div>
  );
}
