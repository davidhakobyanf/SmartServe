


import { io, type Socket } from 'socket.io-client';
import { API_URL } from '../apiUrl';

export function createSocket(
  namespace: string,
  auth?: Record<string, string>,
): Socket {
    const accessToken =
      typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    return io(`${API_URL}${namespace}`, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      auth: {
        ...(accessToken ? { accessToken } : {}),
        ...auth,
      },
    });
}
