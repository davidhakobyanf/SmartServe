import { OnEvent } from '@nestjs/event-emitter';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Permission } from 'src/common/auth/permission';
import { Order } from "src/entities/order.entity";
import { StaffSocketAuthService } from 'src/users/staff-socket-auth.service';
import { ordersResponse } from './order-response';
import { ORDER_DOMAIN_EVENTS, OrderChangePayload } from './order.events';

export const WS_NAMESPACE = 'orders';
export const WS_EVENTS = {
  ORDERS_UPDATED: 'orders:updated',
  JOIN: 'join',
} as const;
export const WS_ROOMS = {
  ORDERS: 'orders',
  REVENUE: 'revenue',
} as const;
@WebSocketGateway({
  namespace: WS_NAMESPACE,
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class OrdersGateway {
  constructor(
    private readonly staffAuth: StaffSocketAuthService,
  ) {}

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage(WS_EVENTS.JOIN)
  async handleJoin(client: Socket) {
    const accessToken = String(
      client.handshake.auth?.accessToken ?? '',
    ).trim();

    try {
      const authorization = await this.staffAuth.authorize(
        accessToken,
        Permission.ORDERS_VIEW,
        'User is not active',
      );
      if (authorization.ok === false) return authorization;
      const { permissions } = authorization;

      await client.leave(WS_ROOMS.ORDERS);
      await client.leave(WS_ROOMS.REVENUE);
      await client.join(
        permissions.includes(Permission.REVENUE_VIEW)
          ? WS_ROOMS.REVENUE
          : WS_ROOMS.ORDERS,
      );
      return { ok: true };
    } catch {
      return { ok: false, error: 'Invalid or expired access token' };
    }
  }

  @OnEvent(ORDER_DOMAIN_EVENTS.CHANGED)
  onOrdersChanged(payload: Order[] | OrderChangePayload) {
    if (!Array.isArray(payload)) {
      const { order, action } = payload;
      const event = { id: order.id, action, status: order.status, table: order.table?.number };
      this.server.to(WS_ROOMS.ORDERS).emit('orders:invalidated', event);
      this.server.to(WS_ROOMS.REVENUE).emit('orders:invalidated', { ...event, total: order.total });
      return;
    }
    // Accept legacy internal callers during the read-model transition.
    const orders = payload;
    this.server
      .to(WS_ROOMS.ORDERS)
      .emit(WS_EVENTS.ORDERS_UPDATED, ordersResponse(orders, false));
    this.server
      .to(WS_ROOMS.REVENUE)
      .emit(WS_EVENTS.ORDERS_UPDATED, ordersResponse(orders, true));
  }
}
