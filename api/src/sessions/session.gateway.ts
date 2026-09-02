import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { OnEvent } from "@nestjs/event-emitter";
import { SessionsService } from "./sessions.service";
import { isUUID } from "class-validator";
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
}
