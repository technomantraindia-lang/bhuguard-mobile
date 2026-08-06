import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notificationsApi';
import { getAuthStartupPhase } from '../auth/startup/AuthStartupController';
import { getAuthToken, getAuthUser, getAuthUserType } from '../utils/authStorage';
import type { ApiRecord } from '../utils/apiHelpers';

const ACTIVE_SYNC_INTERVAL_MS = 15000;

interface NotificationContextValue {
  unreadCount: number;
  notifications: ApiRecord[];
  lastSyncedAt: string | null;
  isSyncing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  markAsRead: (id: number | string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  applyIncomingNotification: (notification: ApiRecord) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

async function canUseAuthenticatedApis(): Promise<boolean> {
  if (getAuthStartupPhase() === 'loading') {
    return false;
  }

  const [token, user, userType] = await Promise.all([
    getAuthToken(),
    getAuthUser(),
    getAuthUserType(),
  ]);

  return Boolean(token && user && (userType || user.user_type));
}

function toCount(value: unknown): number {
  const count = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

export function NotificationProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<ApiRecord[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const refreshUnreadCount = useCallback(async () => {
    if (!enabledRef.current) {
      return;
    }
    if (!(await canUseAuthenticatedApis())) {
      return;
    }

    try {
      const data = await getUnreadNotificationCount();
      setUnreadCount(toCount(data?.unread_count));
    } catch {
      // Keep last known count.
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!enabledRef.current) {
      return;
    }
    if (!(await canUseAuthenticatedApis())) {
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const data = await getNotifications({ per_page: 50 });
      const list = Array.isArray(data?.notifications) ? (data.notifications as ApiRecord[]) : [];

      seenIdsRef.current = new Set(
        list.map((item) => String(item.id ?? '')).filter(Boolean),
      );

      setNotifications(list);
      setUnreadCount(toCount(data?.unread_count));
      setLastSyncedAt(new Date().toISOString());
    } catch {
      setError('Unable to load notifications. Please try again.');
      await refreshUnreadCount();
    } finally {
      setIsSyncing(false);
    }
  }, [refreshUnreadCount]);

  const applyIncomingNotification = useCallback((notification: ApiRecord) => {
    const id = String(notification.id ?? '');
    if (!id || seenIdsRef.current.has(id)) {
      return;
    }

    seenIdsRef.current.add(id);
    setNotifications((current) => [notification, ...current]);
    setUnreadCount((current) => current + 1);
  }, []);

  const markAsRead = useCallback(async (id: number | string) => {
    const data = await markNotificationRead(id);
    setUnreadCount(toCount(data?.unread_count));
    setNotifications((current) =>
      current.map((item) =>
        String(item.id) === String(id)
          ? { ...item, status: 'read', is_read: true, read_at: new Date().toISOString() }
          : item,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications((current) =>
      current.map((item) => ({ ...item, status: 'read', is_read: true, read_at: new Date().toISOString() })),
    );
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void refresh();

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        void refreshUnreadCount();
      }
    }, ACTIVE_SYNC_INTERVAL_MS);

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        void refresh();
      }
    };

    const subscription = AppState.addEventListener('change', onAppState);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [enabled, refresh, refreshUnreadCount]);

  const value = useMemo(
    () => ({
      unreadCount,
      notifications,
      lastSyncedAt,
      isSyncing,
      error,
      refresh,
      refreshUnreadCount,
      markAsRead,
      markAllAsRead,
      applyIncomingNotification,
    }),
    [
      unreadCount,
      notifications,
      lastSyncedAt,
      isSyncing,
      error,
      refresh,
      refreshUnreadCount,
      markAsRead,
      markAllAsRead,
      applyIncomingNotification,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }

  return context;
}

export function useUnreadNotificationCount(enabled = true) {
  const context = useContext(NotificationContext);
  const [fallbackCount, setFallbackCount] = useState(0);

  const fallbackRefresh = useCallback(async () => {
    if (!enabled || context) {
      return;
    }
    if (!(await canUseAuthenticatedApis())) {
      return;
    }

    try {
      const data = await getUnreadNotificationCount();
      setFallbackCount(toCount(data?.unread_count));
    } catch {
      // Keep last known count.
    }
  }, [context, enabled]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return;
      }

      if (context) {
        void context.refreshUnreadCount();
        return;
      }

      void fallbackRefresh();
    }, [context, enabled, fallbackRefresh]),
  );

  if (context) {
    return { unreadCount: context.unreadCount, refreshUnreadCount: context.refreshUnreadCount };
  }

  return { unreadCount: fallbackCount, refreshUnreadCount: fallbackRefresh };
}
