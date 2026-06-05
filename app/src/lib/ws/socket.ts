


import { io, type Socket } from 'socket.io-client';
import { API_URL } from '../apiUrl';

export function createSocket(namespace: string): Socket {
    return io(`${API_URL}${namespace}`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
}