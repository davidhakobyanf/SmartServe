import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { OnEvent } from "@nestjs/event-emitter";
import { SessionsService } from "./sessions.service";
import { isUUID } from "class-validator";

export const WS_NAMESPACE = "sessions";
export const WS_EVENTS = {
  JOIN: "join",
  CLOSED: "closed",
} as const;

export const DOMAIN_EVENTS = {
  SESSION_CLOSED: "session_closed",
} as const;

export type SessionClosedPayload = {
  sessionId: string;
  tableNumber: number;
};

type JoinPayload = { token: string };

@WebSocketGateway({
  namespace: WS_NAMESPACE,
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3001",
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

  @OnEvent(DOMAIN_EVENTS.SESSION_CLOSED)
  onSessionClosed(payload: SessionClosedPayload) {
    this.server
      .to(`session:${payload.sessionId}`)
      .emit(WS_EVENTS.CLOSED, payload);
  }
}
