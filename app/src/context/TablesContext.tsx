'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { App } from 'antd';
import { useTranslations } from 'next-intl';
import { requestAuthScope } from '@/api/api';
import { useProfileData } from '@/context/ProfileDataContext';
import { createSocket } from '@/lib/ws/socket';

type TablesUpdate =
  | { reason: 'session-opened' | 'session-closed'; sessionId: string; tableNumber: number }
  | { reason: 'table-changed'; tableId: string };

interface TablesContextValue {
  revision: number;
  ready: boolean;
  refreshTables: () => Promise<void>;
  newCount: number;
  markSeen: () => void;
}

const TablesContext = createContext<TablesContextValue | null>(null);

export function TablesProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations('tables');
  const { notification } = App.useApp();
  const { permissions, isLoading: profileLoading } = useProfileData();
  const canViewTables = permissions.includes('tables.view');
  const scope = JSON.stringify([canViewTables, requestAuthScope()]);
  const [readyScope, setReadyScope] = useState('');
  const [revision, setRevision] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const notifiedSessions = useRef(new Set<string>());
  const unseenSessions = useRef(new Set<string>());

  const markSeen = useCallback(() => {
    unseenSessions.current.clear();
    setNewCount(0);
  }, []);

  const refreshTables = useCallback(async () => { setRevision(value => value + 1); }, []);

  useEffect(() => {
    if (profileLoading || !canViewTables) {
      notifiedSessions.current.clear();
      markSeen();
      return;
    }

    // Join before the initial HTTP snapshot so opening the page needs only one
    // read and no table update can be lost between subscribing and loading.
    // Keep HTTP usable when WebSockets are unavailable.
    let bootstrapped = false;
    const fallback = window.setTimeout(() => {
      bootstrapped = true;
      setReadyScope(scope);
    }, 1500);
    const socket = createSocket('/tables');
    socket.on('connect', () => {
      socket.emit('join', (result: { ok: boolean }) => {
        if (!result?.ok || !socket.connected) return;
        window.clearTimeout(fallback);
        if (bootstrapped) {
          // A reconnect catches changes missed while the socket was offline.
          void refreshTables();
        } else {
          bootstrapped = true;
          setReadyScope(scope);
        }
      });
    });
    socket.on('tables:updated', (payload: TablesUpdate) => {
      if (!payload || !['session-opened', 'session-closed', 'table-changed'].includes(payload.reason)) return;
      void refreshTables();
      if (payload.reason === 'session-opened' && payload.sessionId && !notifiedSessions.current.has(payload.sessionId)) {
        notifiedSessions.current.add(payload.sessionId);
        unseenSessions.current.add(payload.sessionId);
        setNewCount(unseenSessions.current.size);
        notification.info({
          message: t('notification.title'),
          description: t('notification.description', { number: payload.tableNumber }),
          placement: 'topRight',
          duration: 6,
          key: `table-session-${payload.sessionId}`,
        });
      } else if (payload.reason === 'session-closed') {
        unseenSessions.current.delete(payload.sessionId);
        setNewCount(unseenSessions.current.size);
      }
    });

    return () => {
      window.clearTimeout(fallback);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [canViewTables, profileLoading, refreshTables, notification, t, markSeen, scope]);

  const ready = canViewTables && readyScope === scope;

  return (
    <TablesContext.Provider value={{ revision, ready, refreshTables, newCount, markSeen }}>
      {children}
    </TablesContext.Provider>
  );
}

export function useTables(): TablesContextValue {
  const context = useContext(TablesContext);
  if (!context) throw new Error('useTables must be used within TablesProvider');
  return context;
}
