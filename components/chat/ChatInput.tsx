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
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2">
        {/* File upload button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleFileSelect}
          disabled={disabled || uploading}
          className="flex-shrink-0"
        >
          <Paperclip className="h-4 w-4" />
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
              "min-h-[40px] max-h-[120px] resize-none pr-12",
              "focus-visible:ring-1"
            )}
            rows={1}
          />

          {/* Send button */}
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={disabled || !message.trim() || uploading}
            className="absolute right-1 bottom-1 h-8 w-8"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {uploading && (
        <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          Subiendo archivo...
        </div>
      )}
    </div>
  );
}
