import { JwtService } from "@nestjs/jwt";
import { GATEWAY_OPTIONS, MESSAGE_METADATA } from "@nestjs/websockets/constants";
import { Socket, Server } from "socket.io";
import { OrdersGateway } from "../orders/orders.gateway";
import { WaiterGateway } from "../waiter/waiter.gateway";
import { SessionsGateway } from "../sessions/session.gateway";
import { UsersService } from "../users/users.service";
import { StaffSocketAuthService } from "../users/staff-socket-auth.service";
import { Permission } from "../common/auth/permission";
import { UserStatus } from "../common/auth/user-status";
import { SESSION_DOMAIN_EVENTS } from "../sessions/session.events";
import { ORDER_DOMAIN_EVENTS } from "../orders/order.events";
import { ID, SESSION_ID, orderFixture, sessionFixture, userFixture } from "./fixtures";

describe("WebSocket compatibility", () => {
  let actor: ReturnType<typeof userFixture> | null;
  const jwt = new JwtService({ secret: "ws-contract-test" });
  const users = {
    findById: jest.fn(async () => actor),
    getEffectivePermissions: UsersService.prototype.getEffectivePermissions,
  };
  const sessions = { assertOpen: jest.fn(async () => sessionFixture()) };
  let ordersGateway: OrdersGateway;
  let waiterGateway: WaiterGateway;
  let sessionsGateway: SessionsGateway;
  const emit = jest.fn();
  const to = jest.fn(() => ({ emit }));

  beforeEach(() => {
    jest.clearAllMocks();
    actor = userFixture([Permission.ORDERS_VIEW, Permission.WAITER_CALLS_VIEW]);
    const staffAuth = new StaffSocketAuthService(jwt, users as never);
    ordersGateway = new OrdersGateway(staffAuth);
    waiterGateway = new WaiterGateway(staffAuth, sessions as never);
    sessionsGateway = new SessionsGateway(sessions as never);
    for (const gateway of [ordersGateway, waiterGateway, sessionsGateway]) gateway.server = { to } as unknown as Server;
  });

  function client(auth: Record<string, string> = {}) {
    const join = jest.fn(async () => undefined);
    const leave = jest.fn(async () => undefined);
    return { socket: { handshake: { auth }, join, leave } as unknown as Socket, join, leave };
  }

  it("freezes namespaces, subscribed messages and domain events", () => {
    expect([OrdersGateway, WaiterGateway, SessionsGateway].map((gateway) => ({
      namespace: Reflect.getMetadata(GATEWAY_OPTIONS, gateway).namespace,
      events: Object.getOwnPropertyNames(gateway.prototype).flatMap((key) => {
        const handler = (gateway.prototype as unknown as Record<string, unknown>)[key];
        return typeof handler === "function" && Reflect.hasMetadata(MESSAGE_METADATA, handler)
          ? [Reflect.getMetadata(MESSAGE_METADATA, handler) as string] : [];
      }),
    }))).toEqual([
      { namespace: "orders", events: ["join"] },
      { namespace: "waiter", events: ["join", "waiter:call"] },
      { namespace: "sessions", events: ["join"] },
    ]);
    expect(ORDER_DOMAIN_EVENTS).toEqual({ CHANGED: "orders:changed" });
    expect(SESSION_DOMAIN_EVENTS).toEqual({ CLOSED: "session:closed", BASKET_CHANGED: "session:basket-changed" });
  });

  it.each(["missing", "invalid", "inactive", "inactive-role", "no-user", "no-permission"])("preserves staff acknowledgements for %s", async (scenario) => {
    let accessToken = jwt.sign({ sub: ID });
    if (scenario === "missing") accessToken = " ";
    if (scenario === "invalid") accessToken = "expired";
    if (scenario === "inactive") actor!.status = UserStatus.DISABLED;
    if (scenario === "inactive-role") actor!.role!.isActive = false;
    if (scenario === "no-user") actor = null;
    if (scenario === "no-permission") actor!.role!.permissions = [];
    const socket = client({ accessToken });
    expect(await ordersGateway.handleJoin(socket.socket)).toMatchSnapshot("orders");
    expect(await waiterGateway.handleJoin(socket.socket)).toMatchSnapshot("waiter");
    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.leave).not.toHaveBeenCalled();
  });

  it.each([false, true])("joins the correct room with revenue=%s and clears old rooms", async (revenue) => {
    if (revenue) actor!.role!.permissions.push(Permission.REVENUE_VIEW);
    const socket = client({ accessToken: ` ${jwt.sign({ sub: ID })} ` });
    expect(await ordersGateway.handleJoin(socket.socket)).toEqual({ ok: true });
    expect(socket.leave.mock.calls).toEqual([["orders"], ["revenue"]]);
    expect(socket.join).toHaveBeenCalledWith(revenue ? "revenue" : "orders");
    expect(await waiterGateway.handleJoin(socket.socket)).toEqual({ ok: true });
    expect(socket.join).toHaveBeenLastCalledWith("admin");
  });

  it("preserves acknowledgements when room joining fails", async () => {
    const socket = client({ accessToken: jwt.sign({ sub: ID }) });
    socket.join.mockRejectedValue(new Error("transport failed"));
    expect(await ordersGateway.handleJoin(socket.socket)).toEqual({ ok: false, error: "Invalid or expired access token" });
    expect(await waiterGateway.handleJoin(socket.socket)).toEqual({ ok: false, error: "Invalid or expired access token" });
  });

  it("broadcasts distinct revenue views without changing order snapshots", () => {
    ordersGateway.onOrdersChanged([orderFixture()]);
    expect(to.mock.calls).toEqual([["orders"], ["revenue"]]);
    expect(emit.mock.calls).toMatchSnapshot();
  });

  it("preserves session join payload, room and basket/closed payloads", async () => {
    const socket = client({ sessionToken: ID });
    expect(await sessionsGateway.handleJoin(socket.socket, { token: "invalid" })).toEqual({ ok: false, error: "Invalid session token" });
    expect(await sessionsGateway.handleJoin(socket.socket, { token: ` ${SESSION_ID} ` })).toEqual({ ok: true });
    expect(socket.join).toHaveBeenCalledWith(`session:${SESSION_ID}`);
    sessions.assertOpen.mockRejectedValueOnce(new Error("closed"));
    expect(await sessionsGateway.handleJoin(socket.socket, { token: SESSION_ID })).toEqual({ ok: false, error: "Session is closed or invalid" });
    const payload = { sessionId: SESSION_ID, tableNumber: 7 };
    sessionsGateway.onSessionClosed(payload);
    sessionsGateway.onBasketChanged({ sessionId: SESSION_ID, items: [{ id: ID, quantity: 2 }] });
    expect(to.mock.calls).toEqual([[`session:${SESSION_ID}`], [`session:${SESSION_ID}`]]);
    expect(emit.mock.calls).toEqual([["closed", payload], ["basket:updated", [{ id: ID, quantity: 2 }]]]);
  });

  it("accepts waiter calls only with open session auth and returns the emitted call", async () => {
    expect(await waiterGateway.handleCall(client().socket)).toEqual({ ok: false, error: "Missing or invalid session token" });
    const socket = client({ sessionToken: SESSION_ID });
    const result = await waiterGateway.handleCall(socket.socket);
    expect(result).toEqual({ ok: true, call: { id: expect.any(String), table: "7", calledAt: expect.any(String) } });
    expect(to).toHaveBeenCalledWith("admin");
    expect(emit).toHaveBeenCalledWith("waiter:called", result.call);
    sessions.assertOpen.mockRejectedValueOnce(new Error("closed"));
    emit.mockClear();
    expect(await waiterGateway.handleCall(socket.socket)).toEqual({ ok: false, error: "Session is closed or invalid" });
    expect(emit).not.toHaveBeenCalled();
  });
});
