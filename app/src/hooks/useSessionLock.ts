import { useEffect, useState } from 'react';
import { createSocket } from '@/lib/ws/socket';
import { Socket } from 'socket.io-client';
import type { BasketItemRecord } from '@/types/restaurant';

const NAMESPACE = '/sessions';
const EVT = {
    JOIN: 'join',
    CLOSED: 'closed',
    BASKET_UPDATED: 'basket:updated',
} as const;

export function useSessionLock(token: string) {
    const [closed, setClosed] = useState(false);
    const [basketItems, setBasketItems] = useState<BasketItemRecord[] | null>(null);
    
    useEffect(() => {
        if (!token) return;
        const socket: Socket = createSocket(NAMESPACE, { sessionToken: token });

        const join = () => socket.emit(EVT.JOIN, { token });
        if (socket.connected) join();
        socket.on('connect', join);
        socket.on(EVT.CLOSED, () => setClosed(true));
        socket.on(EVT.BASKET_UPDATED, (items: BasketItemRecord[]) => {
            setBasketItems(Array.isArray(items) ? items : []);
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, [token]);

    return { closed, basketItems };
}
