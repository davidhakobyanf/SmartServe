import { useCallback, useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { createSocket } from '@/lib/ws/socket';
import { apiClient } from '@/api/api';

const ACK_TIMEOUT_MS = 10000;

export function useWaiterClient(sessionId: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const socket = createSocket('/waiter', { sessionToken: sessionId });
    socketRef.current = socket;
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  const callWaiter = useCallback(async (): Promise<{ ok: boolean }> => {
    const socket = socketRef.current;
    if (socket?.connected) {
      const acknowledgement = await new Promise<{ ok: boolean } | null>((resolve) => {
        socket.timeout(ACK_TIMEOUT_MS).emit('waiter:call', {},
          (error: Error | null, response?: { ok: boolean }) => {
            resolve(error ? null : response ?? { ok: false });
          });
      });
      if (acknowledgement) return acknowledgement;
    }

    try {
      const { data } = await apiClient.post<{ ok: boolean }>(
        '/api/waiter/call',
        {},
        { headers: { 'x-session-token': sessionId }, timeout: 30000 },
      );
      return data;
    } catch {
      return { ok: false };
    }
  }, [sessionId]);

  return { callWaiter };
}
