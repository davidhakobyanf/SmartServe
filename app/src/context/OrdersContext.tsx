'use client';
import { createContext, useState, useCallback, useRef, useEffect, useContext } from 'react';
import { App } from 'antd';
import { createSocket } from '@/lib/ws/socket';
import { useProfileData } from '@/context/ProfileDataContext';
import { formatAmount } from '@/lib/formatters';
import { useTranslations } from 'next-intl';

interface OrdersContextValue {
  revision: number;
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
  const [revision, setRevision] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const notified = useRef(new Set<string>());
  const markSeen = useCallback(() => setNewCount(0), []);
  const refreshOrders = useCallback(async () => { setRevision(value => value + 1); }, []);
  useEffect(() => {
    if (isLoading || !canView) { setIsConnected(false); setNewCount(0); return; }
    const socket = createSocket('/orders');
    socket.on('connect', () => {
      socket.emit('join', (result: { ok: boolean }) => {
        setIsConnected(Boolean(result?.ok));
        if (result?.ok) void refreshOrders();
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
    return () => { socket.removeAllListeners(); socket.disconnect(); };
  }, [isLoading, canView, canViewRevenue, notification, t, refreshOrders]);
  return <OrdersContext.Provider value={{ revision, isConnected, refreshOrders, newCount, markSeen }}>{children}</OrdersContext.Provider>;
}
export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) throw new Error('useOrders must be used within OrdersProvider');
  return context;
}
