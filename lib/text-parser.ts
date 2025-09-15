// Utility functions for parsing hashtags and mentions

export interface ParsedContent {
  segments: Array<{
    type: "text" | "hashtag" | "mention";
    content: string;
    value?: string; // The actual hashtag/username without # or @
  }>;
  hashtags: string[];
  mentions: string[];
}

/**
 * Parse text content to extract hashtags and mentions
 */
export function parseContent(text: string): ParsedContent {
  const segments: ParsedContent["segments"] = [];
  const hashtags: string[] = [];
  const mentions: string[] = [];

  // Regular expressions for hashtags and mentions
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;

  let lastIndex = 0;

  // Find all hashtags and mentions with their positions
  const matches: Array<{
    type: "hashtag" | "mention";
    match: string;
    value: string;
    index: number;
  }> = [];

  let match;

  // Find hashtags
  while ((match = hashtagRegex.exec(text)) !== null) {
    matches.push({
      type: "hashtag",
      match: match[0],
      value: match[1],
      index: match.index,
    });
    if (!hashtags.includes(match[1].toLowerCase())) {
      hashtags.push(match[1].toLowerCase());
    }
  }

  // Find mentions
  mentionRegex.lastIndex = 0; // Reset regex
  while ((match = mentionRegex.exec(text)) !== null) {
    matches.push({
      type: "mention",
      match: match[0],
      value: match[1],
      index: match.index,
    });
    if (!mentions.includes(match[1].toLowerCase())) {
      mentions.push(match[1].toLowerCase());
    }
  }

  // Sort matches by position
  matches.sort((a, b) => a.index - b.index);

  // Build segments
  matches.forEach((match) => {
    // Add text before this match
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index);
      if (textContent) {
        segments.push({
          type: "text",
          content: textContent,
        });
      }
    }

    // Add the hashtag/mention
    segments.push({
      type: match.type,
      content: match.match,
      value: match.value,
    });

    lastIndex = match.index + match.match.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      segments.push({
        type: "text",
        content: remainingText,
      });
    }
  }

  // If no matches, add the entire text as a segment
  if (segments.length === 0 && text) {
    segments.push({
      type: "text",
      content: text,
    });
  }

  return {
    segments,
    hashtags,
    mentions,
  };
}

/**
 * Validate hashtag name
 */
export function isValidHashtag(hashtag: string): boolean {
  return (
    /^[a-zA-Z0-9_]+$/.test(hashtag) &&
    hashtag.length >= 1 &&
    hashtag.length <= 50
  );
}

/**
 * Validate username for mentions
 */
export function isValidUsername(username: string): boolean {
  return (
    /^[a-zA-Z0-9_]+$/.test(username) &&
    username.length >= 3 &&
    username.length <= 25
  );
}

/**
 * Extract hashtags from text (returns array of hashtag names without #)
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const hashtags: string[] = [];
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    const hashtag = match[1].toLowerCase();
    if (isValidHashtag(hashtag) && !hashtags.includes(hashtag)) {
      hashtags.push(hashtag);
    }
  }

  return hashtags;
}

/**
 * Extract mentions from text (returns array of usernames without @)
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1].toLowerCase();
    if (isValidUsername(username) && !mentions.includes(username)) {
      mentions.push(username);
    }
  }

  return mentions;
}
