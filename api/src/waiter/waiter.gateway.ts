import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { isUUID } from "class-validator";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { Permission } from "src/common/auth/permission";
import { SessionsService } from "src/sessions/sessions.service";
import { StaffSocketAuthService } from "src/users/staff-socket-auth.service";

export const WS_NAMESPACE = "waiter";
export const WS_EVENTS = {
  JOIN: "join",
  CALL: "waiter:call",
  CALLED: "waiter:called",
} as const;
export const WS_ROOMS = {
  ADMIN: "admin",
} as const;

export type WaiterCallPayload = {
  id: string;
  table: string;
  calledAt: string;
};

@WebSocketGateway({
  namespace: WS_NAMESPACE,
  cors: {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  },
})
export class WaiterGateway {
  constructor(
    private readonly staffAuth: StaffSocketAuthService,
    private readonly sessionsService: SessionsService,
  ) {}

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage(WS_EVENTS.JOIN)
  async handleJoin(client: Socket) {
    const accessToken = String(
      client.handshake.auth?.accessToken ?? "",
    ).trim();

    try {
      const authorization = await this.staffAuth.authorize(
        accessToken,
        Permission.WAITER_CALLS_VIEW,
        "Missing waiter_calls.view permission",
      );
      if (authorization.ok === false) return authorization;

      await client.join(WS_ROOMS.ADMIN);
      return { ok: true };
    } catch {
      return { ok: false, error: "Invalid or expired access token" };
    }
  }

  @SubscribeMessage(WS_EVENTS.CALL)
  async handleCall(client: Socket) {
    const sessionToken = String(
      client.handshake.auth?.sessionToken ?? "",
    ).trim();

    if (!isUUID(sessionToken)) {
      return { ok: false, error: "Missing or invalid session token" };
    }

    try {
      const session = await this.sessionsService.assertOpen(sessionToken);
      const call: WaiterCallPayload = {
        id: uuidv4(),
        table: String(session.table.number),
        calledAt: new Date().toISOString(),
      };

      this.server.to(WS_ROOMS.ADMIN).emit(WS_EVENTS.CALLED, call);
      return { ok: true, call };
    } catch {
      return { ok: false, error: "Session is closed or invalid" };
    }
  }
}
