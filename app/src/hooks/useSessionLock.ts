import { useEffect, useState } from 'react';
import { createSocket } from '@/lib/ws/socket';
import { Socket } from 'socket.io-client';
import type { BasketItemRecord, RelationalOrder } from '@/types/restaurant';

const NAMESPACE = '/sessions';
const EVT = {
    JOIN: 'join',
    CLOSED: 'closed',
    BASKET_UPDATED: 'basket:updated',
    ORDERS_UPDATED: 'orders:updated',
} as const;

export function useSessionLock(token: string | null) {
    const [closed, setClosed] = useState(false);
    const [basketItems, setBasketItems] = useState<BasketItemRecord[] | null>(null);
    const [orders, setOrders] = useState<RelationalOrder[] | null>(null);
    const [connectionVersion, setConnectionVersion] = useState(0);
    
    useEffect(() => {
        setClosed(false);
        setBasketItems(null);
        setOrders(null);
        if (!token) return;
        const socket: Socket = createSocket(NAMESPACE, { sessionToken: token });

        const join = () => socket.emit(EVT.JOIN, { token }, (result: { ok: boolean }) => {
            if (result?.ok && socket.connected) setConnectionVersion((value) => value + 1);
        });
        if (socket.connected) join();
        socket.on('connect', join);
        socket.on(EVT.CLOSED, () => setClosed(true));
        socket.on(EVT.BASKET_UPDATED, (items: BasketItemRecord[]) => {
            setBasketItems(Array.isArray(items) ? items : []);
        });
        socket.on(EVT.ORDERS_UPDATED, (items: RelationalOrder[]) => {
            if (Array.isArray(items)) setOrders(items.filter((order) => order.sessionId === token));
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, [token]);

    return { closed, basketItems, orders, connectionVersion };
}
