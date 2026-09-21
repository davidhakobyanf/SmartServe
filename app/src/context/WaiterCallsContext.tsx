'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { WaiterCall } from '@/types/waiter';
import { createSocket } from '@/lib/ws/socket';
import { App } from 'antd';
import { useProfileData } from '@/context/ProfileDataContext';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/api/api';

interface WaiterCallsContextValue {
  calls: WaiterCall[];
  dismissCall: (id: string) => void;
  clearAll: () => void;
}

const WaiterCallsContext = createContext<WaiterCallsContextValue | null>(null);

export function WaiterCallsProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('waiter');
  const { notification } = App.useApp();
  const { permissions } = useProfileData();
  const canViewCalls = permissions.includes('waiter_calls.view');
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const syncPendingRef = useRef<() => Promise<void>>(async () => {});
  const notificationRef = useRef(notification);
  const translationRef = useRef(t);
  notificationRef.current = notification;
  translationRef.current = t;

  const dismissCall = useCallback((id: string) => {
    void apiClient.patch(`/api/waiter/${id}/resolve`).then(() => {
      setCalls((prev) => prev.filter((call) => call.id !== id));
      void syncPendingRef.current();
    }).catch(() => {
      notificationRef.current.error({ message: translationRef.current('resolveFailed') });
    });
  }, []);

  const clearAll = useCallback(() => {
    void apiClient.post('/api/waiter/resolve-all')
      .then(() => syncPendingRef.current())
      .catch(() => {
        notificationRef.current.error({ message: translationRef.current('resolveFailed') });
      });
  }, []);

  useEffect(() => {
    if (!canViewCalls) {
      setCalls([]);
      return;
    }

    let active = true;
    let liveRevision = 0;
    let fetchInFlight = false;
    let refreshAgain = false;
    const socket = createSocket('/waiter');
    const lastNotifiedAt = new Map<string, number>();

    const notifyCall = (call: WaiterCall, repeated = false) => {
      const previous = lastNotifiedAt.get(call.id);
      if (previous !== undefined && (!repeated || Date.now() - previous < 15000)) return;
      lastNotifiedAt.set(call.id, Date.now());
      notificationRef.current.info({
        message: translationRef.current('notification.title'),
        description: translationRef.current('notification.description', { table: call.table }),
        placement: 'topRight',
        duration: 2,
        key: call.id,
        className: 'waiter-toast',
      });
    };

    const syncPending = async () => {
      if (fetchInFlight) {
        refreshAgain = true;
        return;
      }
      fetchInFlight = true;
      const revision = liveRevision;
      try {
        const { data } = await apiClient.get<WaiterCall[]>('/api/waiter/pending', { timeout: 10000 });
        if (!active || revision !== liveRevision || !Array.isArray(data)) return;
        const pending = data.filter((call) => call?.id && call.table);
        for (const call of pending) notifyCall(call);
        setCalls(pending);
      } catch {
        // Socket events continue to work while the HTTP refresh is unavailable.
      } finally {
        fetchInFlight = false;
        if (active && refreshAgain) {
          refreshAgain = false;
          void syncPending();
        }
      }
    };
    syncPendingRef.current = syncPending;

    socket.on('connect', () => {
      socket.emit('join', () => { void syncPending(); });
    });

    socket.on('waiter:pending', () => { void syncPending(); });

    socket.on('waiter:called', (payload: WaiterCall) => {
      if (!payload?.id || !payload?.table) return;
      liveRevision += 1;
      setCalls((prev) => [payload, ...prev.filter((call) => call.table !== payload.table)]);
      notifyCall(payload, true);
    });

    socket.on('waiter:resolved', (id: string) => {
      liveRevision += 1;
      setCalls((prev) => prev.filter((call) => call.id !== id));
    });
    socket.on('waiter:cleared', () => {
      liveRevision += 1;
      setCalls([]);
    });

    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') void syncPending();
    };
    document.addEventListener('visibilitychange', refreshOnVisible);
    window.addEventListener('focus', refreshOnVisible);
    const interval = window.setInterval(() => { void syncPending(); }, 15000);
    void syncPending();

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshOnVisible);
      window.removeEventListener('focus', refreshOnVisible);
      socket.removeAllListeners();
      socket.disconnect();
      syncPendingRef.current = async () => {};
    };
  }, [canViewCalls]);

  return (
    <WaiterCallsContext.Provider value={{ calls, dismissCall, clearAll }}>
      {children}
    </WaiterCallsContext.Provider>
  );
}

export function useWaiterCalls(): WaiterCallsContextValue {
  const ctx = useContext(WaiterCallsContext);
  if (!ctx) throw new Error('useWaiterCalls must be used within WaiterCallsProvider');
  return ctx;
}
