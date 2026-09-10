'use client';
import { createContext, useState, useCallback, useRef, useEffect, useContext } from 'react';
import { App } from 'antd';
import { createSocket } from '@/lib/ws/socket';
import { useProfileData } from '@/context/ProfileDataContext';
import { formatAmount } from '@/lib/formatters';
import { useTranslations } from 'next-intl';
import { requestAuthScope } from '@/api/api';

interface OrdersContextValue {
  revision: number;
  ready: boolean;
  isConnected: boolean;
  refreshOrders: () => Promise<void>;
  newCount: number;
  markSeen: () => void;
}
const OrdersContext = createContext<OrdersContextValue | null>(null);
export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations('orders');
  const { notification } = App.useApp();
  const { permissions, isLoading } = useProfileData();
  const canView = permissions.includes('orders.view');
  const canViewRevenue = permissions.includes('revenue.view');
  const scope = JSON.stringify([canView, requestAuthScope()]);
  const [readyScope, setReadyScope] = useState('');
  const [revision, setRevision] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const notified = useRef(new Set<string>());
  const markSeen = useCallback(() => setNewCount(0), []);
  const refreshOrders = useCallback(async () => { setRevision(value => value + 1); }, []);
  useEffect(() => {
    if (isLoading || !canView) { setIsConnected(false); setNewCount(0); return; }
    // Subscribe before the first HTTP snapshot. This avoids an initial read
    // followed by another read when the socket join acknowledgement arrives.
    let bootstrapped = false;
    const fallback = window.setTimeout(() => {
      bootstrapped = true;
      setReadyScope(scope);
    }, 1500);
    const socket = createSocket('/orders');
    socket.on('connect', () => {
      socket.emit('join', (result: { ok: boolean }) => {
        const joined = Boolean(result?.ok && socket.connected);
        setIsConnected(joined);
        if (!joined) return;
        window.clearTimeout(fallback);
        if (bootstrapped) {
          // Catch up after a delayed connection or a real reconnect.
          void refreshOrders();
        } else {
          bootstrapped = true;
          setReadyScope(scope);
        }
      });
    });
    socket.on('orders:invalidated', (event: { id: string; action: string; table: number; total?: number }) => {
      void refreshOrders();
      if (event.action !== 'created' || notified.current.has(event.id)) return;
      notified.current.add(event.id);
      if (notified.current.size > 1000) notified.current.delete(notified.current.values().next().value!);
      setNewCount(value => value + 1);
      notification.info({
        message: t('notification.title'),
        description: canViewRevenue && event.total !== undefined
          ? t('notification.withTotal', { table: event.table, total: formatAmount(event.total) })
          : t('notification.table', { table: event.table }),
        key: event.id, placement: 'topRight', duration: 6,
      });
    });
    socket.on('orders:updated', refreshOrders);
    socket.on('disconnect', () => setIsConnected(false));
    return () => { window.clearTimeout(fallback); socket.removeAllListeners(); socket.disconnect(); };
  }, [isLoading, canView, canViewRevenue, notification, t, refreshOrders, scope]);
  const ready = canView && readyScope === scope;
  return <OrdersContext.Provider value={{ revision, ready, isConnected, refreshOrders, newCount, markSeen }}>{children}</OrdersContext.Provider>;
}
export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) throw new Error('useOrders must be used within OrdersProvider');
  return context;
}
