import { useRef } from 'react';
import {  Socket } from 'socket.io-client';
import { useEffect, useCallback } from 'react';
import { createSocket } from '@/lib/ws/socket';


const NAMESPACE = '/waiter';
const EVT = { CALL: 'waiter:call' } as const;
export function useWaiterClient(tableId: string) {
   const socketRef = useRef<Socket | null>(null);


   useEffect(() => {
    const socket = createSocket(NAMESPACE);
    socketRef.current = socket;
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const callWaiter = useCallback(() => {
    return new Promise<{ ok: boolean }>((resolve) => {
      const socket = socketRef.current;
      if (!socket?.connected) {
        resolve({ ok: false });
        return;
      }

      socket.emit(EVT.CALL, { table: tableId }, (response: {ok:boolean}) => {
        resolve(response ?? { ok: false });
      });
    });
  }, [tableId]);

  return { callWaiter };
}