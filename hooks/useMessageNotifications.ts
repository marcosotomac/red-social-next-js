"use client";

import { useEffect, useState } from "react";
import { useConversations } from "./useConversations";

export function useMessageNotifications() {
  const { totalUnreadCount } = useConversations();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationsEnabled(true);
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setNotificationsEnabled(permission === "granted");
        });
      }
    }
  }, []);

  // Show browser notification for new messages
  const showNotification = (title: string, body: string, icon?: string) => {
    if (notificationsEnabled && document.hidden) {
      new Notification(title, {
        body,
        icon: icon || "/favicon.ico",
        tag: "new-message", // Prevents multiple notifications
      });
    }
  };

  // Update document title with unread count
  useEffect(() => {
    const originalTitle = document.title.replace(/^\(\d+\) /, "");

    if (totalUnreadCount > 0) {
      document.title = `(${totalUnreadCount}) ${originalTitle}`;
    } else {
      document.title = originalTitle;
    }

    return () => {
      document.title = originalTitle;
    };
  }, [totalUnreadCount]);

  return {
    totalUnreadCount,
    notificationsEnabled,
    showNotification,
  };
}
