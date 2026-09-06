'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import type { WaiterCall } from "@/types/waiter";
import { createSocket } from "@/lib/ws/socket";
import { App } from "antd";
import { useProfileData } from "@/context/ProfileDataContext";
import { useTranslations } from 'next-intl';



const NAMESPACE = '/waiter';
const EVT = { JOIN: 'join', CALLED: 'waiter:called' } as const;
interface WaiterCallsContextValue {
    calls: WaiterCall[];
    dismissCall: (id: string) => void;
    clearAll: () => void;
}

const WaiterCallsContext = createContext<WaiterCallsContextValue | null>(null);

export function WaiterCallsProvider({ children }: { children: ReactNode }) {
    const t = useTranslations('waiter');
    const { notification } = App.useApp();
    const { permissions, isLoading } = useProfileData();
    const canViewCalls = permissions.includes('waiter_calls.view');
    const [calls, setCalls] = useState<WaiterCall[]>([]);

    const dismissCall = useCallback((id: string) => {
        setCalls((prev) => prev.filter((c) => c.id !== id));
    }, []);
    
    const clearAll = useCallback(() => {
        setCalls([]);
    },[]);

    useEffect(() => {
        if (isLoading || !canViewCalls) {
            setCalls([]);
            return;
        }

        const socket = createSocket(NAMESPACE); 

        socket.on('connect', () => {
            socket.emit(EVT.JOIN);
        });

        socket.on(EVT.CALLED, (payload: WaiterCall) => {
            if (!payload?.id || !payload?.table) return;
            
            setCalls((prev) => {
                const withoutDuplicate = prev.filter((c) => c.table !== payload.table);
                return [payload, ...withoutDuplicate];
            });

            // Toast is transient: it auto-closes after 2s with a slide-right
            // fade-out. The dashboard entry (in `calls`) stays until the admin
            // resolves it manually, so intentionally no `onClose`/dismiss here.
            notification.info({
                message: t('notification.title'),
                description: t('notification.description', { table: payload.table }),
                placement:'topRight',
                duration: 2,
                key: payload.id,
                className: 'waiter-toast',
            })
        });

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, [canViewCalls, isLoading, notification, t]);

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
