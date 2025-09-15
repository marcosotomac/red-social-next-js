"use client";

import { formatDateDivider } from "@/lib/timeUtils";

interface DateDividerProps {
  date: string;
}

export function DateDivider({ date }: DateDividerProps) {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="flex-1 h-px bg-border" />
      <div className="px-3 py-1 text-xs text-muted-foreground bg-background border rounded-full">
        {formatDateDivider(date)}
      </div>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
