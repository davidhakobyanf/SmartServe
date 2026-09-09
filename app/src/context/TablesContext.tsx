'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { App } from 'antd';
import { useTranslations } from 'next-intl';
import { useProfileData } from '@/context/ProfileDataContext';
import { createSocket } from '@/lib/ws/socket';

type TablesUpdate =
  | { reason: 'session-opened' | 'session-closed'; sessionId: string; tableNumber: number }
  | { reason: 'table-changed'; tableId: string };

interface TablesContextValue {
  revision: number;
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
  const canViewQr = permissions.includes('tables.qr.manage');
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

    void refreshTables();
    const socket = createSocket('/tables');
    socket.on('connect', () => {
      socket.emit('join', (result: { ok: boolean }) => {
        // Fetch after joining so a change during connection setup is not lost.
        if (result?.ok && socket.connected) void refreshTables();
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
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [canViewTables, canViewQr, profileLoading, refreshTables, notification, t, markSeen]);

  return (
    <TablesContext.Provider value={{ revision, refreshTables, newCount, markSeen }}>
      {children}
    </TablesContext.Provider>
  );
}

export function useTables(): TablesContextValue {
  const context = useContext(TablesContext);
  if (!context) throw new Error('useTables must be used within TablesProvider');
  return context;
}
