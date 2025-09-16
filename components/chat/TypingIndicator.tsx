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
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium italic">
        {getTypingText()}
      </span>
    </div>
  );
}
