import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { v4 as uuidv4 } from 'uuid';





export const WS_NAMESPACE = 'waiter';
export const WS_EVENTS = {
    JOIN:'join',
    CALL:'waiter:call',
    CALLED:'waiter:called',
} as const;
export const WS_ROOMS = {
    ADMIN:'admin',
} as const;

export type WaiterCallPayload = {
    id:string;
    table:string;
    calledAt:string;
};

type JoinPayload = { role: 'admin' };
type CallPayload = { table: string | number };

@WebSocketGateway({
    namespace:WS_NAMESPACE,
    cors: {
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
        credentials: true,
    },
})

export class WaiterGateway {
    @WebSocketServer()
    server!: Server;

    @SubscribeMessage(WS_EVENTS.JOIN)
    handleJoin(client: Socket, payload: JoinPayload) {
        if(payload.role === 'admin') {
            client.join(WS_ROOMS.ADMIN)
        }
        return { ok: true };
    }

    @SubscribeMessage(WS_EVENTS.CALL)
    handleCall(_client: Socket, payload: CallPayload) {
        const table = String(payload?.table ?? '').trim();
        if (!table) {
            return { ok:false, error: 'table is required' };
        }

        const call: WaiterCallPayload = {
            id: uuidv4(),
            table,
            calledAt: new Date().toISOString(),
        };

        this.server.to(WS_ROOMS.ADMIN).emit(WS_EVENTS.CALLED, call);
        return { ok: true, call };
    }
    
}