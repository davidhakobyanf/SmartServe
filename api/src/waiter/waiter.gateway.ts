import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { isUUID } from "class-validator";
import { Server, Socket } from "socket.io";
import { Permission } from "src/common/auth/permission";
import { SessionsService } from "src/sessions/sessions.service";
import { StaffSocketAuthService } from "src/users/staff-socket-auth.service";
import { WaiterCallsService } from "./waiter-calls.service";
import { DiningSession } from "src/entities/dining-session.entity";

export const WS_NAMESPACE = "waiter";
export const WS_EVENTS = {
  JOIN: "join",
  CALL: "waiter:call",
  CALLED: "waiter:called",
  PENDING: "waiter:pending",
  RESOLVE: "waiter:resolve",
  RESOLVED: "waiter:resolved",
  RESOLVE_ALL: "waiter:resolve-all",
  CLEARED: "waiter:cleared",
} as const;
export const WS_ROOMS = {
  ADMIN: "admin",
} as const;

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
    private readonly calls: WaiterCallsService,
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
      client.emit(WS_EVENTS.PENDING, await this.calls.pending());
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
      const call = await this.callForSession(session);
      return { ok: true, call };
    } catch {
      return { ok: false, error: "Session is closed or invalid" };
    }
  }

  async callForSession(session: DiningSession) {
    const call = await this.calls.call(session.id, session.table.number);
    this.server.to(WS_ROOMS.ADMIN).emit(WS_EVENTS.CALLED, call);
    return call;
  }

  @SubscribeMessage(WS_EVENTS.RESOLVE)
  async handleResolve(client: Socket, id: string) {
    if (!(await this.authorizeAdmin(client))) return { ok: false };
    if (!isUUID(id)) return { ok: false, error: "Invalid call id" };
    await this.resolveCall(id);
    return { ok: true };
  }

  async resolveCall(id: string): Promise<void> {
    await this.calls.resolve(id);
    this.server.to(WS_ROOMS.ADMIN).emit(WS_EVENTS.RESOLVED, id);
  }

  @SubscribeMessage(WS_EVENTS.RESOLVE_ALL)
  async handleResolveAll(client: Socket) {
    if (!(await this.authorizeAdmin(client))) return { ok: false };
    await this.resolveAllCalls();
    return { ok: true };
  }

  async resolveAllCalls(): Promise<void> {
    await this.calls.resolveAll();
    this.server.to(WS_ROOMS.ADMIN).emit(WS_EVENTS.CLEARED);
  }

  private async authorizeAdmin(client: Socket): Promise<boolean> {
    const accessToken = String(client.handshake.auth?.accessToken ?? "").trim();
    const result = await this.staffAuth.authorize(
      accessToken,
      Permission.WAITER_CALLS_VIEW,
      "Missing waiter_calls.view permission",
    );
    return result.ok;
  }
}
