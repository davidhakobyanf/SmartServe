'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { App } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import tablesApi from '@/api/tablesApi';
import { useProfileData } from '@/context/ProfileDataContext';
import { createSocket } from '@/lib/ws/socket';
import type { RestaurantTable } from '@/types/tables';
import { resolveLocalizedText } from '@/types/localization';

type TablesUpdate =
  | { reason: 'session-opened' | 'session-closed'; sessionId: string; tableNumber: number }
  | { reason: 'table-changed'; tableId: string };

interface TablesContextValue {
  tables: RestaurantTable[];
  loading: boolean;
  refreshTables: () => Promise<void>;
  newCount: number;
  markSeen: () => void;
}

const TablesContext = createContext<TablesContextValue | null>(null);

export function TablesProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const t = useTranslations('tables');
  const { message, notification } = App.useApp();
  const { permissions, isLoading: profileLoading } = useProfileData();
  const canViewTables = permissions.includes('tables.view');
  const canViewQr = permissions.includes('tables.qr.manage');
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const requestVersion = useRef(0);
  const notifiedSessions = useRef(new Set<string>());
  const unseenSessions = useRef(new Set<string>());

  const invalidateRequests = useCallback(() => {
    ++requestVersion.current;
  }, []);

  const markSeen = useCallback(() => {
    unseenSessions.current.clear();
    setNewCount(0);
  }, []);

  const refreshTables = useCallback(async () => {
    if (profileLoading || !canViewTables) return;
    const version = ++requestVersion.current;
    try {
      const data = await tablesApi.getTables();
      if (version === requestVersion.current) {
        setTables(data.map((table) => ({
          ...table,
          name: resolveLocalizedText(table.nameTranslations, table.name ?? '', locale) || null,
        })));
      }
    } catch {
      if (version === requestVersion.current) message.error(t('messages.loadError'));
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [canViewTables, profileLoading, locale, message, t]);

  useEffect(() => {
    if (profileLoading || !canViewTables) {
      setTables([]);
      setLoading(profileLoading);
      notifiedSessions.current.clear();
      markSeen();
      return;
    }

    setLoading(true);
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
      invalidateRequests();
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [canViewTables, canViewQr, profileLoading, refreshTables, notification, t, markSeen, invalidateRequests]);

  return (
    <TablesContext.Provider value={{ tables, loading, refreshTables, newCount, markSeen }}>
      {children}
    </TablesContext.Provider>
  );
}

export function useTables(): TablesContextValue {
  const context = useContext(TablesContext);
  if (!context) throw new Error('useTables must be used within TablesProvider');
  return context;
}
