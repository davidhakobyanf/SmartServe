import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { OnEvent } from "@nestjs/event-emitter";
import { SessionsService } from "./sessions.service";
import { isUUID } from "class-validator";
import { Order } from "src/entities/order.entity";
import { ORDER_DOMAIN_EVENTS } from "src/orders/order.events";
import { ordersResponse } from "src/orders/order-response";
import {
  SESSION_DOMAIN_EVENTS,
  SessionBasketPayload,
  SessionClosedPayload,
} from "./session.events";

export const WS_NAMESPACE = "sessions";
export const WS_EVENTS = {
  JOIN: "join",
  CLOSED: "closed",
  BASKET_UPDATED: "basket:updated",
  ORDERS_UPDATED: "orders:updated",
} as const;

type JoinPayload = { token: string };

@WebSocketGateway({
  namespace: WS_NAMESPACE,
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  },
})
export class SessionsGateway {
  constructor(private readonly sessionsService: SessionsService) {}

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage(WS_EVENTS.JOIN)
  async handleJoin(client: Socket, payload: JoinPayload) {
    const token = String(payload?.token ?? "").trim();

    if (!isUUID(token)) {
      return { ok: false, error: "Invalid session token" };
    }

    try {
      await this.sessionsService.assertOpen(token);
      await client.join(`session:${token}`);

      return { ok: true };
    } catch {
      return { ok: false, error: "Session is closed or invalid" };
    }
  }

  @OnEvent(SESSION_DOMAIN_EVENTS.CLOSED)
  onSessionClosed(payload: SessionClosedPayload) {
    this.server
      .to(`session:${payload.sessionId}`)
      .emit(WS_EVENTS.CLOSED, payload);
  }

  @OnEvent(SESSION_DOMAIN_EVENTS.BASKET_CHANGED)
  onBasketChanged(payload: SessionBasketPayload) {
    this.server
      .to(`session:${payload.sessionId}`)
      .emit(WS_EVENTS.BASKET_UPDATED, payload.items);
  }

  @OnEvent(ORDER_DOMAIN_EVENTS.CHANGED)
  onOrdersChanged(orders: Order[]) {
    const bySession = new Map<string, Order[]>();
    for (const order of orders) {
      if (order.session?.status === "closed") continue;
      const list = bySession.get(order.sessionId) ?? [];
      list.push(order);
      bySession.set(order.sessionId, list);
    }
    for (const [sessionId, list] of bySession) {
      this.server.to(`session:${sessionId}`).emit(WS_EVENTS.ORDERS_UPDATED, ordersResponse(list, true));
    }
  }
}
