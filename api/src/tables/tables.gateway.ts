import { OnEvent } from "@nestjs/event-emitter";
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Permission } from "src/common/auth/permission";
import { StaffSocketAuthService } from "src/users/staff-socket-auth.service";
import { SESSION_DOMAIN_EVENTS, SessionClosedPayload, SessionOpenedPayload } from "src/sessions/session.events";
import { TABLE_DOMAIN_EVENTS, TableChangedPayload } from "./table.events";

export const WS_NAMESPACE = "tables";
export const WS_EVENTS = { JOIN: "join", UPDATED: "tables:updated" } as const;
const STAFF_ROOM = "staff";

@WebSocketGateway({
  namespace: WS_NAMESPACE,
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  },
})
export class TablesGateway {
  constructor(private readonly staffAuth: StaffSocketAuthService) {}

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage(WS_EVENTS.JOIN)
  async handleJoin(client: Socket) {
    try {
      // Reauthorization must also remove a previous subscription on failure.
      await client.leave(STAFF_ROOM);
      const result = await this.staffAuth.authorize(
        String(client.handshake.auth?.accessToken ?? "").trim(),
        Permission.TABLES_VIEW,
        "User is not active",
      );
      if (result.ok === false) return result;
      await client.join(STAFF_ROOM);
      return { ok: true };
    } catch {
      return { ok: false, error: "Invalid or expired access token" };
    }
  }

  // Send only an invalidation; HTTP applies locale and QR permissions.
  @OnEvent(SESSION_DOMAIN_EVENTS.OPENED)
  onSessionOpened(payload: SessionOpenedPayload) {
    this.server.to(STAFF_ROOM).emit(WS_EVENTS.UPDATED, {
      reason: "session-opened", sessionId: payload.sessionId, tableNumber: payload.tableNumber,
    });
  }

  @OnEvent(SESSION_DOMAIN_EVENTS.CLOSED)
  onSessionClosed(payload: SessionClosedPayload) {
    this.server.to(STAFF_ROOM).emit(WS_EVENTS.UPDATED, {
      reason: "session-closed", sessionId: payload.sessionId, tableNumber: payload.tableNumber,
    });
  }

  @OnEvent(TABLE_DOMAIN_EVENTS.CHANGED)
  onTableChanged(payload: TableChangedPayload) {
    this.server.to(STAFF_ROOM).emit(WS_EVENTS.UPDATED, {
      reason: "table-changed", tableId: payload.tableId,
    });
  }
}
