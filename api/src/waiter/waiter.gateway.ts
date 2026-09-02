import { JwtService } from "@nestjs/jwt";
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { isUUID } from "class-validator";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { Permission } from "src/common/auth/permission";
import { UserStatus } from "src/common/auth/user-status";
import { SessionsService } from "src/sessions/sessions.service";
import { UsersService } from "src/users/users.service";

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
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {}

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage(WS_EVENTS.JOIN)
  async handleJoin(client: Socket) {
    const accessToken = String(
      client.handshake.auth?.accessToken ?? "",
    ).trim();

    if (!accessToken) {
      return { ok: false, error: "Missing access token" };
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        accessToken,
      );
      const user = await this.usersService.findById(payload.sub);
      const permissions = user
        ? this.usersService.getEffectivePermissions(user)
        : [];

      if (
        !user ||
        user.status !== UserStatus.ACTIVE ||
        !user.role?.isActive ||
        !permissions.includes(Permission.WAITER_CALLS_VIEW)
      ) {
        return { ok: false, error: "Missing waiter_calls.view permission" };
      }

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
