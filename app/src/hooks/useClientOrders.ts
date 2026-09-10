'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { App } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { normalizeOrderRecord } from '@/lib/normalizeMenuCard';
import type { OrderStatus, RelationalOrder } from '@/types/restaurant';
import type { GuestOrderChange } from './useSessionLock';
import { useServerList } from './useServerList';

export function useClientOrders(token: string | null, enabled: boolean, liveOrders: RelationalOrder[] | null, connectionVersion: number, change?: GuestOrderChange | null) {
  const locale = useLocale();
  const t = useTranslations('client');
  const { notification } = App.useApp();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const list = useServerList<RelationalOrder>('/api/guest-lists/orders', { page, pageSize }, enabled && Boolean(token), token ?? '');
  const statuses = useRef(new Map<string, OrderStatus>());
  const notified = useRef(new Set<string>());
  const refreshRef = useRef(list.invalidate);
  refreshRef.current = list.invalidate;
  const notifyReady = useRef<(id: string) => void>(() => {});
  notifyReady.current = (id) => {
    if (notified.current.has(id)) return;
    notified.current.add(id);
    notification.success({ message: t('history.readyTitle'), description: t('history.readyDescription', { id: id.slice(-5).toUpperCase() }), placement: 'topRight', duration: 8, key: `order-ready-${id}` });
  };
  useEffect(() => { setPage(1); statuses.current.clear(); notified.current.clear(); }, [token]);
  const lastConnection = useRef(connectionVersion);
  useEffect(() => {
    if (enabled && (connectionVersion !== lastConnection.current || liveOrders)) refreshRef.current();
    lastConnection.current = connectionVersion;
  }, [enabled, connectionVersion, liveOrders]);
  useEffect(() => {
    if (!enabled || !change || change.sessionId !== token) return;
    if (change.status === 'ready') notifyReady.current(change.id);
    statuses.current.set(change.id, change.status);
    void refreshRef.current();
  }, [change, enabled, token]);
  useEffect(() => {
    for (const order of list.data?.items ?? []) {
      const previous = statuses.current.get(order.id);
      if (previous && previous !== 'ready' && order.status === 'ready') notifyReady.current(order.id);
      statuses.current.set(order.id, order.status);
    }
  }, [list.data]);
  const orders = useMemo(() => (list.data?.items ?? []).map(order => normalizeOrderRecord(order, locale)), [list.data, locale]);
  return { orders, total: list.data?.total ?? 0, pageData: list.data, loading: list.loading, error: list.error, refreshOrders: list.refresh,
    onPageChange: (next: number, size: number) => { setPage(next); setPageSize(size); } };
}
