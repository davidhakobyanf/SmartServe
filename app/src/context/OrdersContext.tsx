import { createContext, useState, useCallback, useRef, useEffect, useContext } from 'react';
import type { OrderRecord } from '@/types/orders';
import { normalizeOrderRecord } from '@/lib/normalizeMenuCard';
import { createSocket } from '@/lib/ws/socket';
import clientAPI from '@/api/api';





const NAMESPACE = '/orders';
const EVT = { JOIN: 'join', UPDATED: 'orders:updated' } as const;

let ordersRequest: Promise<void> | null = null;


interface OrdersContextValue {
    orders: OrderRecord[];
    isConnected: boolean;
    refreshOrders: () => Promise<void>;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

function normalizeList(raw: unknown) : OrderRecord[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => normalizeOrderRecord(item as OrderRecord));
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
    const [orders,setOrders] = useState<OrderRecord[]>([]) 
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);

    const refreshOrders = useCallback(async () => {
        if (ordersRequest) {
            await ordersRequest;
            return;
        }

        ordersRequest = (async () => {
            try {
                const { data } = await clientAPI.getOrders();
                setOrders(normalizeList(data));
            } finally {
                ordersRequest = null;
            }
        })();

        await ordersRequest;
    }, []);

    useEffect(() => {
        const socket = createSocket(NAMESPACE);
        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit(EVT.JOIN, { role: 'admin' });
            void refreshOrders();
        });

        socket.on(EVT.UPDATED, (payload: unknown) => {
            setOrders(normalizeList(payload));
        })

        socket.on('disconnect', () => setIsConnected(false));
        
        return () => {
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, [refreshOrders]);

    return (
        <OrdersContext.Provider value={{orders, isConnected, refreshOrders}}>
            {children}
        </OrdersContext.Provider>

    )
}

export function useOrders(): OrdersContextValue {
    const ctx = useContext(OrdersContext);
    if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
    return ctx;
}