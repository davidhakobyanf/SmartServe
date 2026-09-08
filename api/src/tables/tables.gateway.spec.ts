import { Socket, Server } from "socket.io";
import { Permission } from "src/common/auth/permission";
import { TablesGateway } from "./tables.gateway";

describe("TablesGateway", () => {
  const staffAuth = { authorize: jest.fn() };
  const emit = jest.fn();
  const to = jest.fn(() => ({ emit }));
  let gateway: TablesGateway;

  beforeEach(() => {
    jest.resetAllMocks();
    to.mockReturnValue({ emit });
    gateway = new TablesGateway(staffAuth as never);
    gateway.server = { to } as unknown as Server;
  });

  function client() {
    return { handshake: { auth: { accessToken: " token " } }, join: jest.fn(), leave: jest.fn() };
  }

  it("authorizes staff with tables.view before subscribing", async () => {
    staffAuth.authorize.mockResolvedValue({ ok: true, permissions: [Permission.TABLES_VIEW] });
    const socket = client();
    expect(await gateway.handleJoin(socket as unknown as Socket)).toEqual({ ok: true });
    expect(staffAuth.authorize).toHaveBeenCalledWith("token", Permission.TABLES_VIEW, "User is not active");
    expect(socket.join).toHaveBeenCalledWith("staff");
  });

  it.each(["Missing access token", "Invalid or expired access token", "Missing tables.view permission", "User is not active"])("rejects subscription: %s", async (error) => {
    staffAuth.authorize.mockResolvedValue({ ok: false, error });
    const socket = client();
    expect(await gateway.handleJoin(socket as unknown as Socket)).toEqual({ ok: false, error });
    expect(socket.leave).toHaveBeenCalledWith("staff");
    expect(socket.join).not.toHaveBeenCalled();
  });

  it("broadcasts opening, closing and editing only to staff without public QR tokens", () => {
    const session = { sessionId: "session-1", tableNumber: 1, publicToken: "must-not-leak" };
    gateway.onSessionOpened(session);
    gateway.onSessionClosed(session);
    gateway.onTableChanged({ tableId: "table-1" });
    expect(to.mock.calls).toEqual([["staff"], ["staff"], ["staff"]]);
    expect(emit.mock.calls).toEqual([
      ["tables:updated", { reason: "session-opened", sessionId: "session-1", tableNumber: 1 }],
      ["tables:updated", { reason: "session-closed", sessionId: "session-1", tableNumber: 1 }],
      ["tables:updated", { reason: "table-changed", tableId: "table-1" }],
    ]);
  });
});
