'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { normalizeOrderRecord } from '@/lib/normalizeMenuCard';
import type { OrderStatus, RelationalOrder } from '@/types/restaurant';
import type { GuestOrderChange } from './useSessionLock';
import { useServerList } from './useServerList';

const orderAttentionKey = (token: string) => `smartserve:order-update:${token}`;
const legacyReadyAttentionKey = (token: string) => `smartserve:ready-order:${token}`;
const isAttentionStatus = (status: OrderStatus): status is 'preparing' | 'ready' => status === 'preparing' || status === 'ready';

export function useClientOrders(token: string | null, enabled: boolean, liveOrders: RelationalOrder[] | null, connectionVersion: number, change?: GuestOrderChange | null, viewingOrders = false) {
  const locale = useLocale();
  const t = useTranslations('client');
  const { notification } = App.useApp();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [orderAttention, setOrderAttention] = useState(false);
  const list = useServerList<RelationalOrder>('/api/guest-lists/orders', { page, pageSize }, enabled && Boolean(token), token ?? '');
  const statuses = useRef(new Map<string, OrderStatus>());
  const notified = useRef(new Set<string>());
  const refreshRef = useRef(list.invalidate);
  refreshRef.current = list.invalidate;
  const notifyStatus = useRef<(id: string, status: 'preparing' | 'ready') => void>(() => {});
  notifyStatus.current = (id, status) => {
    const eventKey = `${id}:${status}`;
    if (notified.current.has(eventKey)) return;
    notified.current.add(eventKey);
    const details = {
      message: t(status === 'preparing' ? 'history.preparingTitle' : 'history.readyTitle'),
      description: t(status === 'preparing' ? 'history.preparingDescription' : 'history.readyDescription', { id: id.slice(-5).toUpperCase() }),
      placement: 'topRight' as const,
      duration: 8,
      key: `order-${status}-${id}`,
    };
    if (status === 'preparing') notification.info(details);
    else notification.success(details);
    if (!viewingOrders && token) {
      setOrderAttention(true);
      try { sessionStorage.setItem(orderAttentionKey(token), '1'); } catch { /* Storage may be unavailable. */ }
    }
  };
  useEffect(() => { setPage(1); statuses.current.clear(); notified.current.clear(); }, [token]);
  useEffect(() => {
    if (!token) {
      setOrderAttention(false);
      return;
    }
    try { setOrderAttention(sessionStorage.getItem(orderAttentionKey(token)) === '1' || sessionStorage.getItem(legacyReadyAttentionKey(token)) === '1'); }
    catch { setOrderAttention(false); }
  }, [token]);
  const clearOrderAttention = useCallback(() => {
    setOrderAttention(false);
    if (token) {
      try {
        sessionStorage.removeItem(orderAttentionKey(token));
        sessionStorage.removeItem(legacyReadyAttentionKey(token));
      } catch { /* Storage may be unavailable. */ }
    }
  }, [token]);
  const lastConnection = useRef(connectionVersion);
  useEffect(() => {
    if (enabled && (connectionVersion !== lastConnection.current || liveOrders)) refreshRef.current();
    lastConnection.current = connectionVersion;
  }, [enabled, connectionVersion, liveOrders]);
  useEffect(() => {
    if (!enabled || !change || change.sessionId !== token) return;
    if (isAttentionStatus(change.status)) notifyStatus.current(change.id, change.status);
    statuses.current.set(change.id, change.status);
    void refreshRef.current();
  }, [change, enabled, token]);
  useEffect(() => {
    for (const order of list.data?.items ?? []) {
      const previous = statuses.current.get(order.id);
      if (previous && previous !== order.status && isAttentionStatus(order.status)) notifyStatus.current(order.id, order.status);
      statuses.current.set(order.id, order.status);
    }
  }, [list.data]);
  const orders = useMemo(() => (list.data?.items ?? []).map(order => normalizeOrderRecord(order, locale)), [list.data, locale]);
  return { orders, total: list.data?.total ?? 0, payableTotal: list.data?.stats?.payableTotal ?? null, orderAttention, clearOrderAttention, pageData: list.data, loading: list.loading, error: list.error, refreshOrders: list.refresh,
    onPageChange: (next: number, size: number) => { setPage(next); setPageSize(size); } };
}
