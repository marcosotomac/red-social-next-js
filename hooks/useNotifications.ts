"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  getUserNotifications,
  getNotificationCounts,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  Notification,
  NotificationCounts
} from "@/lib/notifications";

interface UseNotificationsState {
  notifications: Notification[];
  counts: NotificationCounts | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  lastFetch: Date | null;
}

interface UseNotificationsActions {
  // Data operations
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  refreshCounts: () => Promise<void>;
  
  // Notification actions
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteOne: (notificationId: string) => Promise<boolean>;
  
  // Filters
  toggleUnreadOnly: () => void;
  setTypeFilter: (type: Notification['type'] | null) => void;
  
  // Real-time
  subscribeToUpdates: () => void;
  unsubscribeFromUpdates: () => void;
}

interface UseNotificationsOptions {
  limit?: number;
  autoRefresh?: boolean;
  realTime?: boolean;
  unreadOnly?: boolean;
  typeFilter?: Notification['type'] | null;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    limit = 20,
    autoRefresh = true,
    realTime = true,
    unreadOnly: initialUnreadOnly = false,
    typeFilter: initialTypeFilter = null
  } = options;

  // State
  const [state, setState] = useState<UseNotificationsState>({
    notifications: [],
    counts: null,
    loading: true,
    error: null,
    hasMore: true,
    lastFetch: null
  });

  // Filters
  const [unreadOnly, setUnreadOnly] = useState(initialUnreadOnly);
  const [typeFilter, setTypeFilter] = useState<Notification['type'] | null>(initialTypeFilter);

  // Refs
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());
  const offsetRef = useRef(0);

  // Load notifications
  const loadNotifications = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        offsetRef.current = 0;
        setState(prev => ({ ...prev, loading: true, error: null }));
      }

      const { success, notifications, total, error } = await getUserNotifications(
        limit,
        reset ? 0 : offsetRef.current,
        unreadOnly
      );

      if (!success || !notifications) {
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: error || "Failed to load notifications" 
        }));
        return;
      }

      // Filter by type if specified
      let filteredNotifications = notifications;
      if (typeFilter) {
        filteredNotifications = notifications.filter(n => n.type === typeFilter);
      }

      setState(prev => ({
        ...prev,
        notifications: reset 
          ? filteredNotifications 
          : [...prev.notifications, ...filteredNotifications],
        loading: false,
        error: null,
        hasMore: (total || 0) > (reset ? filteredNotifications.length : prev.notifications.length + filteredNotifications.length),
        lastFetch: new Date()
      }));

      if (!reset) {
        offsetRef.current += filteredNotifications.length;
      }

    } catch (error) {
      console.error("Error loading notifications:", error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: "Failed to load notifications" 
      }));
    }
  }, [limit, unreadOnly, typeFilter]);

  // Load counts
  const loadCounts = useCallback(async () => {
    try {
      const { success, counts, error } = await getNotificationCounts();
      
      if (success && counts) {
        setState(prev => ({ ...prev, counts }));
      } else {
        console.error("Error loading counts:", error);
      }
    } catch (error) {
      console.error("Error loading notification counts:", error);
    }
  }, []);

  // Actions
  const refreshNotifications = useCallback(async () => {
    await loadNotifications(true);
    await loadCounts();
  }, [loadNotifications, loadCounts]);

  const loadMoreNotifications = useCallback(async () => {
    if (state.loading || !state.hasMore) return;
    await loadNotifications(false);
  }, [loadNotifications, state.loading, state.hasMore]);

  const refreshCounts = useCallback(async () => {
    await loadCounts();
  }, [loadCounts]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { success } = await markNotificationAsRead(notificationId);
      
      if (success) {
        // Update local state
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => 
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        }));
        
        // Refresh counts
        await refreshCounts();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }, [refreshCounts]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const { success } = await markAllNotificationsAsRead();
      
      if (success) {
        // Update local state
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, is_read: true }))
        }));
        
        // Refresh counts
        await refreshCounts();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }, [refreshCounts]);

  const deleteOne = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { success } = await deleteNotification(notificationId);
      
      if (success) {
        // Update local state
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.filter(n => n.id !== notificationId)
        }));
        
        // Refresh counts
        await refreshCounts();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }, [refreshCounts]);

  const toggleUnreadOnly = useCallback(() => {
    setUnreadOnly(prev => !prev);
  }, []);

  const setTypeFilterAction = useCallback((type: Notification['type'] | null) => {
    setTypeFilter(type);
  }, []);

  // Real-time subscription
  const subscribeToUpdates = useCallback(() => {
    if (!realTime || subscriptionRef.current) return;

    const supabase = supabaseRef.current;
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      subscriptionRef.current = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Notification update:', payload);
            
            // Refresh data when notifications change
            refreshNotifications();
          }
        )
        .subscribe();
    });
  }, [realTime, refreshNotifications]);

  const unsubscribeFromUpdates = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  // Effects
  useEffect(() => {
    loadNotifications(true);
    loadCounts();
  }, [loadNotifications, loadCounts, unreadOnly, typeFilter]);

  useEffect(() => {
    if (realTime) {
      subscribeToUpdates();
    }

    return () => {
      unsubscribeFromUpdates();
    };
  }, [realTime, subscribeToUpdates, unsubscribeFromUpdates]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshCounts();
    }, 30000); // Refresh counts every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshCounts]);

  // Return state and actions
  const actions: UseNotificationsActions = {
    refreshNotifications,
    loadMoreNotifications,
    refreshCounts,
    markAsRead,
    markAllAsRead,
    deleteOne,
    toggleUnreadOnly,
    setTypeFilter: setTypeFilterAction,
    subscribeToUpdates,
    unsubscribeFromUpdates
  };

  return {
    ...state,
    unreadOnly,
    typeFilter,
    ...actions
  };
}

// Export individual hooks for specific use cases

/**
 * Simple hook for just notification counts
 */
export function useNotificationCounts() {
  const [counts, setCounts] = useState<NotificationCounts | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { success, counts: newCounts } = await getNotificationCounts();
    if (success && newCounts) {
      setCounts(newCounts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    
    // Auto-refresh every minute
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { counts, loading, refresh };
}

/**
 * Hook for real-time notification updates
 */
export function useNotificationUpdates(onUpdate?: (notification: Notification) => void) {
  const supabase = createClient();
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  const subscribe = useCallback(() => {
    if (subscriptionRef.current) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      subscriptionRef.current = supabase
        .channel('notification_updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (onUpdate && payload.new) {
              onUpdate(payload.new as Notification);
            }
          }
        )
        .subscribe();
    });
  }, [supabase, onUpdate]);

  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  useEffect(() => {
    subscribe();
    return unsubscribe;
  }, [subscribe, unsubscribe]);

  return { subscribe, unsubscribe };
}