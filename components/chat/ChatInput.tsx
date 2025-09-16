"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (
    content: string,
    messageType?: "text" | "image" | "file",
    fileUrl?: string
  ) => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  disabled = false,
  placeholder = "Escribe un mensaje...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      // Stop typing indicator
      if (onStopTyping) {
        onStopTyping();
      }
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      // Here you would upload the file to Supabase Storage
      // For now, we'll create a placeholder URL
      const fileUrl = URL.createObjectURL(file);
      const messageType = file.type.startsWith("image/") ? "image" : "file";

      onSendMessage(file.name, messageType, fileUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Trigger typing indicator
    if (e.target.value.length > 0 && onStartTyping) {
      onStartTyping();
    } else if (e.target.value.length === 0 && onStopTyping) {
      onStopTyping();
    }

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className="p-4 border-t border-white/20 dark:border-gray-700/30 backdrop-blur-sm bg-white/40 dark:bg-gray-800/40">
      <div className="flex items-end gap-3">
        {/* File upload button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleFileSelect}
          disabled={disabled || uploading}
          className="flex-shrink-0 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-full h-10 w-10 transition-all duration-200"
        >
          <Paperclip className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "min-h-[48px] max-h-[120px] resize-none pr-14 border-0",
              "bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm",
              "ring-1 ring-white/30 dark:ring-gray-700/30 rounded-2xl",
              "focus-visible:ring-2 focus-visible:ring-pink-400/50",
              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
              "text-gray-900 dark:text-gray-100"
            )}
            rows={1}
          />

          {/* Send button */}
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={disabled || !message.trim() || uploading}
            className={cn(
              "absolute right-2 bottom-2 h-10 w-10 rounded-full",
              "bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600",
              "text-white shadow-lg transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {uploading && (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-pink-400 border-t-transparent rounded-full" />
          Subiendo archivo...
        </div>
      )}
    </div>
  );
}
