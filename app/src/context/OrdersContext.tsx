'use client';

import {
  createContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useContext,
} from 'react';
import { App } from 'antd';
import type { OrderRecord } from '@/types/orders';
import { normalizeOrderRecord } from '@/lib/normalizeMenuCard';
import { createSocket } from '@/lib/ws/socket';
import clientAPI from '@/api/api';
import { useProfileData } from '@/context/ProfileDataContext';
import type { RelationalOrder } from '@/types/restaurant';

const NAMESPACE = '/orders';
const EVT = { JOIN: 'join', UPDATED: 'orders:updated' } as const;

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

let ordersRequest: Promise<void> | null = null;

interface OrdersContextValue {
  orders: OrderRecord[];
  isConnected: boolean;
  refreshOrders: () => Promise<void>;
  newCount: number;
  markSeen: () => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

function normalizeList(raw: unknown): OrderRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => normalizeOrderRecord(item as RelationalOrder));
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { notification } = App.useApp();
  const { permissions, isLoading: profileLoading } = useProfileData();
  const canViewOrders = permissions.includes('orders.view');
  const canViewRevenue = permissions.includes('revenue.view');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Apply a fresh orders list; fire a toast + badge for genuinely new orders.
  const applyOrders = useCallback((list: OrderRecord[]) => {
    if (initializedRef.current) {
      const added = list.filter((o) => o._id && !seenIdsRef.current.has(o._id));
      if (added.length > 0) {
        setNewCount((c) => c + added.length);
        added.forEach((o) =>
          notification.open({
            type: 'info',
            message: 'Նոր պատվեր',
            description: canViewRevenue
              ? `Սեղան ${o.table} — ${fmt(o.allPrice)} ֏`
              : `Սեղան ${o.table}`,
            placement: 'topRight',
            duration: 6,
            key: o._id,
          }),
        );
      }
    }
    seenIdsRef.current = new Set(list.map((o) => o._id));
    initializedRef.current = true;
    setOrders(list);
  }, [canViewRevenue, notification]);

  const markSeen = useCallback(() => setNewCount(0), []);

  const refreshOrders = useCallback(async () => {
    if (!canViewOrders) return;

    if (ordersRequest) {
      await ordersRequest;
      return;
    }

    ordersRequest = (async () => {
      try {
        const { data } = await clientAPI.getOrders();
        applyOrders(normalizeList(data));
      } finally {
        ordersRequest = null;
      }
    })();

    await ordersRequest;
  }, [applyOrders, canViewOrders]);

  useEffect(() => {
    if (profileLoading || !canViewOrders) {
      setOrders([]);
      setIsConnected(false);
      return;
    }

    const socket = createSocket(NAMESPACE);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit(EVT.JOIN);
      void refreshOrders();
    });

    socket.on(EVT.UPDATED, (payload: unknown) => {
      applyOrders(normalizeList(payload));
    });

    socket.on('disconnect', () => setIsConnected(false));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [refreshOrders, applyOrders, canViewOrders, profileLoading]);

  return (
    <OrdersContext.Provider
      value={{ orders, isConnected, refreshOrders, newCount, markSeen }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}
