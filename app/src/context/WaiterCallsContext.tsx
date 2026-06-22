'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import type { WaiterCall } from "@/types/waiter";
import { createSocket } from "@/lib/ws/socket";
import { notification } from "antd";



const NAMESPACE = '/waiter';
const EVT = { JOIN: 'join', CALLED: 'waiter:called' } as const;
interface WaiterCallsContextValue {
    calls: WaiterCall[];
    dismissCall: (id: string) => void;
    clearAll: () => void;
}

const WaiterCallsContext = createContext<WaiterCallsContextValue | null>(null);

export function WaiterCallsProvider({ children }: { children: ReactNode }) {
    const [calls, setCalls] = useState<WaiterCall[]>([]);

    const dismissCall = useCallback((id: string) => {
        setCalls((prev) => prev.filter((c) => c.id !== id));
    }, []);
    
    const clearAll = useCallback(() => {
        setCalls([]);
    },[]);

    useEffect(() => {
        const socket = createSocket(NAMESPACE); 

        socket.on('connect', () => {
            socket.emit(EVT.JOIN, { role: 'admin' });
        });

        socket.on(EVT.CALLED, (payload: WaiterCall) => {
            if (!payload?.id || !payload?.table) return;
            
            setCalls((prev) => {
                const withoutDuplicate = prev.filter((c) => c.table !== payload.table);
                return [payload, ...withoutDuplicate];
            });

            notification.info({
                message:'Մատուցողի կանչ',
                description: `Սեղան ${payload.table} - խնդրում են մատուցող`,
                placement:'topRight',
                duration: 0,
                key: payload.id,
                onClose: () => dismissCall(payload.id),
            })
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, [dismissCall]);

    return (
        <WaiterCallsContext.Provider value={{ calls, dismissCall, clearAll }}>
            {children}
        </WaiterCallsContext.Provider>
    )

}

export function useWaiterCalls(): WaiterCallsContextValue {
    const ctx = useContext(WaiterCallsContext);
    if (!ctx) {
        throw new Error('useWaiterCalls must be used within WaiterCallsProvider');
    }
    return ctx;
}