'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import clientAPI from '@/api/api';
import { normalizeOrderRecord } from '@/lib/normalizeMenuCard';
import type { OrderStatus, RelationalOrder } from '@/types/restaurant';

export function useClientOrders(token: string | null, enabled: boolean, liveOrders: RelationalOrder[] | null, connectionVersion: number) {
  const locale = useLocale();
  const t = useTranslations('client');
  const { notification } = App.useApp();
  const [rawOrders, setRawOrders] = useState<RelationalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const version = useRef(0);
  const statuses = useRef(new Map<string, OrderStatus>());
  const notified = useRef(new Set<string>());
  const notifyReady = useRef<((id: string) => void) | null>(null);
  notifyReady.current = (id) => notification.success({
    message: t('history.readyTitle'),
    description: t('history.readyDescription', { id: id.slice(-5).toUpperCase() }),
    placement: 'topRight',
    duration: 8,
    key: `order-ready-${id}`,
  });

  const applyOrders = useCallback((items: RelationalOrder[]) => {
    const ownOrders = items.filter((order) => order.sessionId === token);
    for (const order of ownOrders) {
      const previous = statuses.current.get(order.id);
      // Initial history is a baseline, not a new "ready" notification.
      if (order.status === 'ready' && previous && previous !== 'ready' && !notified.current.has(order.id)) {
        notified.current.add(order.id);
        notifyReady.current?.(order.id);
      }
      statuses.current.set(order.id, order.status);
    }
    setRawOrders(ownOrders);
    setLoading(false);
    setError(false);
  }, [token]);

  const invalidate = useCallback(() => { ++version.current; }, []);
  const refreshOrders = useCallback(async () => {
    if (!token || !enabled) return;
    const request = ++version.current;
    try {
      const { data } = await clientAPI.getMyOrders(token);
      if (request === version.current) applyOrders(data);
    } catch {
      if (request === version.current) setError(true);
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, [token, enabled, applyOrders]);

  useEffect(() => {
    setRawOrders([]);
    setLoading(enabled);
    setError(false);
    statuses.current.clear();
    notified.current.clear();
    return invalidate;
  }, [token, enabled, invalidate]);

  useEffect(() => {
    void refreshOrders();
    return invalidate;
  }, [refreshOrders, connectionVersion, invalidate]);

  useEffect(() => {
    if (enabled && liveOrders) {
      invalidate();
      applyOrders(liveOrders);
    }
  }, [liveOrders, enabled, applyOrders, invalidate]);

  const orders = useMemo(() => rawOrders
    .filter((order) => order.sessionId === token)
    .map((order) => normalizeOrderRecord(order, locale)), [rawOrders, token, locale]);

  return { orders, loading, error, refreshOrders };
}
