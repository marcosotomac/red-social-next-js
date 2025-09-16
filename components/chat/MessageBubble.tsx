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
        <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-white/50 shadow-sm">
          <AvatarImage src={message.sender.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-xs font-semibold">
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
          <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
            {message.sender.full_name}
          </span>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-3 max-w-full break-words shadow-lg backdrop-blur-sm border",
            isOwnMessage
              ? "bg-gradient-to-r from-pink-400 to-purple-500 text-white border-white/20"
              : "bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 border-white/30 dark:border-gray-700/30"
          )}
        >
          {message.message_type === "text" && (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          )}

          {message.message_type === "image" && (
            <div className="space-y-3">
              {message.content && (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
              )}
              {message.file_url && (
                <div
                  className="relative rounded-xl overflow-hidden ring-1 ring-white/20"
                  style={{ maxHeight: "300px", maxWidth: "100%" }}
                >
                  <Image
                    src={message.file_url}
                    alt="Shared image"
                    width={400}
                    height={300}
                    className="rounded-xl max-w-full h-auto object-cover"
                    style={{ maxHeight: "300px" }}
                  />
                </div>
              )}
            </div>
          )}

          {message.message_type === "file" && (
            <div className="space-y-3">
              {message.content && (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
              )}
              {message.file_url && (
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "text-sm underline hover:no-underline flex items-center gap-2 p-3 rounded-lg transition-all duration-200",
                    isOwnMessage
                      ? "bg-white/20 hover:bg-white/30 text-white"
                      : "bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                  )}
                >
                  📎 Descargar archivo
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span className="font-medium">
            {formatMessageTime(message.created_at)}
          </span>
          {message.edited_at && (
            <span className="italic text-gray-400 dark:text-gray-500">
              (editado)
            </span>
          )}
          {isOwnMessage && (
            <div className="ml-1">
              {isRead ? (
                <CheckCheck className="h-3 w-3 text-blue-400" />
              ) : (
                <Check className="h-3 w-3 text-gray-400" />
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
