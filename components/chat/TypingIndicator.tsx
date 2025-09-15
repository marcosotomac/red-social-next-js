"use client";

import { TypingUser } from "@/hooks/useTypingIndicator";

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].full_name} está escribiendo...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].full_name} y ${typingUsers[1].full_name} están escribiendo...`;
    } else {
      return `${typingUsers[0].full_name} y ${
        typingUsers.length - 1
      } más están escribiendo...`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
}
