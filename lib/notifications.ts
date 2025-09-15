"use client";

import { createClient } from "@/lib/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  type: 'like_post' | 'like_story' | 'comment' | 'follow' | 'message' | 'mention';
  title: string;
  message: string;
  related_id?: string;
  related_type?: 'post' | 'story' | 'message' | 'user' | 'comment';
  actor_id?: string;
  actor?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationCounts {
  total: number;
  unread: number;
  byType: {
    like_post: number;
    like_story: number;
    comment: number;
    follow: number;
    message: number;
    mention: number;
  };
}

/**
 * Get user's notifications with pagination
 */
export async function getUserNotifications(
  limit: number = 20,
  offset: number = 0,
  unreadOnly: boolean = false
): Promise<{
  success: boolean;
  notifications?: Notification[];
  total?: number;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    let query = supabase
      .from("notifications")
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      notifications: notifications as Notification[],
      total: count || 0
    };
  } catch (error) {
    console.error("Error in getUserNotifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

/**
 * Get notification counts
 */
export async function getNotificationCounts(): Promise<{
  success: boolean;
  counts?: NotificationCounts;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    // Get counts by type (unread only)
    const { data: typeCounts } = await supabase
      .from("notifications")
      .select("type")
      .eq("user_id", user.id)
      .eq("is_read", false);

    const byType = {
      like_post: 0,
      like_story: 0,
      comment: 0,
      follow: 0,
      message: 0,
      mention: 0
    };

    typeCounts?.forEach(notification => {
      if (notification.type in byType) {
        byType[notification.type as keyof typeof byType]++;
      }
    });

    return {
      success: true,
      counts: {
        total: totalCount || 0,
        unread: unreadCount || 0,
        byType
      }
    };
  } catch (error) {
    console.error("Error in getNotificationCounts:", error);
    return { success: false, error: "Failed to get notification counts" };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", notificationId)
      .eq("user_id", user.id); // Security check

    if (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("notifications")
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error);
    return { success: false, error: "Failed to mark all notifications as read" };
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", user.id); // Security check

    if (error) {
      console.error("Error deleting notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteNotification:", error);
    return { success: false, error: "Failed to delete notification" };
  }
}

/**
 * Create manual notification (for system use)
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedId,
  relatedType,
  actorId
}: {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: Notification['related_type'];
  actorId?: string;
}): Promise<{
  success: boolean;
  notificationId?: string;
  error?: string;
}> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId,
        related_type: relatedType,
        actor_id: actorId
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true, notificationId: data.id };
  } catch (error) {
    console.error("Error in createNotification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

/**
 * Get notification by ID
 */
export async function getNotificationById(notificationId: string): Promise<{
  success: boolean;
  notification?: Notification;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: notification, error } = await supabase
      .from("notifications")
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true, notification: notification as Notification };
  } catch (error) {
    console.error("Error in getNotificationById:", error);
    return { success: false, error: "Failed to fetch notification" };
  }
}