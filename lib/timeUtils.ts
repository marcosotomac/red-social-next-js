import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { es } from "date-fns/locale";

export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();

  if (isToday(date)) {
    return format(date, "HH:mm");
  }

  if (isYesterday(date)) {
    return "Ayer " + format(date, "HH:mm");
  }

  if (isThisWeek(date)) {
    return format(date, "EEEE HH:mm", { locale: es });
  }

  // More than a week ago
  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays < 30) {
    return format(date, "d MMM HH:mm", { locale: es });
  }

  return format(date, "d MMM yyyy", { locale: es });
}

export function formatConversationTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();

  if (isToday(date)) {
    return format(date, "HH:mm");
  }

  if (isYesterday(date)) {
    return "Ayer";
  }

  if (isThisWeek(date)) {
    return format(date, "EEEE", { locale: es });
  }

  const diffInDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays < 365) {
    return format(date, "d MMM", { locale: es });
  }

  return format(date, "d/M/yy");
}

export function shouldShowDateDivider(
  currentMessage: string,
  previousMessage?: string
): boolean {
  if (!previousMessage) return true;

  const currentDate = new Date(currentMessage);
  const previousDate = new Date(previousMessage);

  // Show divider if messages are from different days
  return (
    !isToday(currentDate) ||
    currentDate.toDateString() !== previousDate.toDateString()
  );
}

export function formatDateDivider(timestamp: string): string {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return "Hoy";
  }

  if (isYesterday(date)) {
    return "Ayer";
  }

  return format(date, "EEEE, d MMMM yyyy", { locale: es });
}

export function formatStoryTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));

  if (diffInMinutes < 1) {
    return "ahora";
  }

  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes}m`;
  }

  if (diffInHours < 24) {
    return `hace ${diffInHours}h`;
  }

  if (diffInHours < 48) {
    return "ayer";
  }

  // More than 2 days ago, show days
  const diffInDays = Math.floor(diffInHours / 24);
  return `hace ${diffInDays}d`;
}
