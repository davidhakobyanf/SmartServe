import { ForbiddenException } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { SESSION_DOMAIN_EVENTS } from "./session.events";
import { QueryFailedError } from "typeorm";

describe("SessionsService", () => {
  const sessionRepo = {
    exists: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };
  const tablesRepo = { findOne: jest.fn() };
  const events = { emit: jest.fn() };

  let service: SessionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SessionsService(
      sessionRepo as never,
      tablesRepo as never,
      events as never,
    );
  });

  it("returns the same open session to everyone at one table", async () => {
    const table = { id: "table-1", publicToken: "qr-token", number: 1 };
    const openSession = { id: "session-1", tableId: table.id, table };
    tablesRepo.findOne.mockResolvedValue(table);
    sessionRepo.findOne.mockResolvedValue(openSession);

    await expect(service.openForTable("qr-token")).resolves.toBe(openSession);
    expect(sessionRepo.save).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });

  it("creates a new session when the table has no open session", async () => {
    const table = { id: "table-1", publicToken: "qr-token", number: 1 };
    const created = { id: "new-session", tableId: table.id, table };
    tablesRepo.findOne.mockResolvedValue(table);
    sessionRepo.findOne.mockResolvedValue(null);
    sessionRepo.exists.mockResolvedValue(false);
    sessionRepo.create.mockImplementation((value) => ({ ...value, id: "new-session" }));
    sessionRepo.save.mockResolvedValue(created);

    await expect(service.openForTable("qr-token")).resolves.toBe(created);
    expect(sessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tableId: table.id, status: "open" }),
    );
    expect(events.emit).toHaveBeenCalledTimes(1);
    expect(events.emit).toHaveBeenCalledWith(SESSION_DOMAIN_EVENTS.OPENED, {
      sessionId: created.id, tableNumber: table.number,
    });
    expect(sessionRepo.save.mock.invocationCallOrder[0]).toBeLessThan(events.emit.mock.invocationCallOrder[0]);
  });

  it("does not announce a second arrival when concurrent scans reuse the winning session", async () => {
    const table = { id: "table-1", number: 1 };
    const winner = { id: "winning-session", tableId: table.id, table };
    tablesRepo.findOne.mockResolvedValue(table);
    sessionRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(winner);
    sessionRepo.exists.mockResolvedValue(false);
    sessionRepo.save.mockRejectedValueOnce(new QueryFailedError("INSERT", [], { code: "23505" } as never));

    await expect(service.openForTable("qr-token")).resolves.toBe(winner);
    expect(events.emit).not.toHaveBeenCalled();
  });

  it("does not announce an arrival when persistence fails", async () => {
    tablesRepo.findOne.mockResolvedValue({ id: "table-1", number: 1 });
    sessionRepo.findOne.mockResolvedValue(null);
    sessionRepo.exists.mockResolvedValue(false);
    sessionRepo.save.mockRejectedValueOnce(new Error("database unavailable"));

    await expect(service.openForTable("qr-token")).rejects.toThrow("database unavailable");
    expect(events.emit).not.toHaveBeenCalled();
  });

  it("rejects access after a session is closed", async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: "session-1",
      status: "closed",
      table: { number: 1 },
    });

    await expect(service.assertOpen("session-1")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("closes a session and sends the close event", async () => {
    const session = {
      id: "session-1",
      status: "open",
      closedAt: null,
      table: { number: 4 },
    };
    sessionRepo.findOne.mockResolvedValue(session);
    sessionRepo.save.mockImplementation(async (value) => value);

    const result = await service.close("session-1");

    expect(result.status).toBe("closed");
    expect(result.closedAt).toBeInstanceOf(Date);
    expect(events.emit).toHaveBeenCalledWith(SESSION_DOMAIN_EVENTS.CLOSED, {
      sessionId: "session-1",
      tableNumber: 4,
    });
  });
});
