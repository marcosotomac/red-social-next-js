"use client";

import Link from "next/link";
import { parseContent } from "@/lib/text-parser";

interface ParsedTextProps {
  content: string;
  className?: string;
}

export function ParsedText({ content, className = "" }: ParsedTextProps) {
  const parsed = parseContent(content);

  return (
    <span className={className}>
      {parsed.segments.map((segment, index) => {
        switch (segment.type) {
          case "hashtag":
            return (
              <Link
                key={index}
                href={`/hashtag/${encodeURIComponent(segment.value || "")}`}
                className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium transition-colors"
              >
                {segment.content}
              </Link>
            );
          case "mention":
            return (
              <Link
                key={index}
                href={`/profile/${encodeURIComponent(segment.value || "")}`}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {segment.content}
              </Link>
            );
          default:
            return <span key={index}>{segment.content}</span>;
        }
      })}
    </span>
  );
}
