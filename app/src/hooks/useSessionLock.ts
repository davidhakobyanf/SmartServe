import { useEffect, useState } from 'react';
import { createSocket } from '@/lib/ws/socket';
import { Socket } from 'socket.io-client';

const NAMESPACE = '/sessions';
const EVT = { JOIN: 'join', CLOSED: 'closed' } as const;

export function useSessionLock(token: string) {
    const [closed, setClosed] = useState(false);
    
    useEffect(() => {
        if (!token) return;
        const socket: Socket = createSocket(NAMESPACE, { sessionToken: token });

        const join = () => socket.emit(EVT.JOIN, { token });
        if (socket.connected) join();
        socket.on('connect', join);
        socket.on(EVT.CLOSED, () => setClosed(true));

        return () => {
            socket.removeAllListeners();
            socket.disconnect();
        };
    }, [token]);

    return { closed };
}
