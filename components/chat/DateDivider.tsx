"use client";

import { formatDateDivider } from "@/lib/timeUtils";

interface DateDividerProps {
  date: string;
}

export function DateDivider({ date }: DateDividerProps) {
  return (
    <div className="flex items-center justify-center my-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200/50 to-transparent dark:via-pink-700/30" />
      <div className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-full shadow-sm">
        {formatDateDivider(date)}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-pink-200/50 to-transparent dark:via-pink-700/30" />
    </div>
  );
}
