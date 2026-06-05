import { OnEvent } from '@nestjs/event-emitter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OrderRecord } from "src/common/types/menu-card";



export const WS_NAMESPACE = 'orders';
export const WS_EVENTS = {
    ORDERS_UPDATED:'orders:updated',
    JOIN:'join',
} as const;
export const  WS_ROOMS = {
    ADMIN: 'admin',
} as const;
export const DOMAIN_EVENTS = {
    ORDERS_CHANGED:'orders:changed',
} as const;

type JoinPayload= { role: 'admin' | 'client'; table?: string };

@WebSocketGateway({
    namespace:WS_NAMESPACE,
    cors:{
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
        credentials: true,
    },
})
export class OrdersGateway {
    @WebSocketServer()
    server!: Server;

    @SubscribeMessage(WS_EVENTS.JOIN)
    handleJoin(client: Socket, payload: JoinPayload) {
        if (payload.role === 'admin') {
            client.join(WS_ROOMS.ADMIN);
        }
        if (payload.role === 'client' && payload.table) {
            client.join(`table:${payload.table}`);
        }
        return { ok: true };
    }

    @OnEvent(DOMAIN_EVENTS.ORDERS_CHANGED)
    onOrdersChanged(orders: OrderRecord[]) {
        this.server.to(WS_ROOMS.ADMIN).emit(WS_EVENTS.ORDERS_UPDATED, orders);
    }
}