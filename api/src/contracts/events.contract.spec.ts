import { OrdersService } from "../orders/orders.service";
import { SessionsService } from "../sessions/sessions.service";
import { BasketItemsService } from "../basket-items/basket-items.service";
import { DiningSession } from "../entities/dining-session.entity";
import { BasketItem } from "../entities/basket-item.entity";
import { Order } from "../entities/order.entity";
import { OrderItem } from "../entities/order-item.entity";
import { SESSION_ID, orderFixture, productFixture, sessionFixture } from "./fixtures";

describe("Persistence and domain-event ordering", () => {
  it.each([false, true])("publishes only after successful transaction resolution (failure=%s)", async (failure) => {
    const timeline: string[] = [];
    const events = { emit: jest.fn((name: string) => timeline.push(name)) };
    const sessionRepo = { findOne: jest.fn(async () => sessionFixture()) };
    const basketRepo = {
      find: jest.fn(async () => [{ productId: "product", product: productFixture(), unitPrice: 0.1, quantity: 3, sauces: [{ id: "sauce", name: "Sauce", unitPrice: 0.2 }] }]),
      delete: jest.fn(async () => { timeline.push("basket-delete"); }),
    };
    const orderRepo = {
      create: (value: unknown) => value,
      save: jest.fn(async (value: object) => { timeline.push("order-save"); return { ...value, id: "order" }; }),
      findOneOrFail: async () => orderFixture(),
    };
    const itemsRepo = {
      create: (value: unknown) => value,
      save: jest.fn(async (value: unknown) => {
        timeline.push("order-items-save");
        return value;
      }),
    };
    const manager = {
      getRepository: (entity: unknown) => {
        if (entity === DiningSession) return sessionRepo;
        if (entity === BasketItem) return basketRepo;
        if (entity === Order) return orderRepo;
        if (entity === OrderItem) return itemsRepo;
        throw new Error("Unexpected entity");
      },
    };
    const source = {
      transaction: async (callback: (value: typeof manager) => Promise<Order>) => {
        const result = await callback(manager);
        expect(events.emit).not.toHaveBeenCalled();
        if (failure) throw new Error("commit failed");
        timeline.push("commit");
        return result;
      },
    };
    const service = new OrdersService({ find: async () => [orderFixture()] } as never, source as never, events as never);
    if (failure) {
      await expect(service.createFromBasket(SESSION_ID)).rejects.toThrow("commit failed");
      expect(events.emit).not.toHaveBeenCalled();
    } else {
      await service.createFromBasket(SESSION_ID);
      expect(timeline).toEqual(["order-save", "order-items-save", "basket-delete", "commit", "session:basket-changed", "orders:changed"]);
    }
    expect(sessionRepo.findOne).toHaveBeenCalledWith({ where: { id: SESSION_ID }, lock: { mode: "pessimistic_write" } });
    expect(orderRepo.save).toHaveBeenCalledWith(expect.objectContaining({ total: 0.9 }));
    expect(itemsRepo.save).toHaveBeenCalledWith([
      expect.objectContaining({
        orderId: "order",
        lineTotal: 0.9,
        titleSnapshot: "Burger",
        descriptionSnapshot: "Beef",
      }),
    ]);
    expect(basketRepo.find).toHaveBeenCalledWith({ where: { sessionId: SESSION_ID }, relations: { product: true }, order: { createdAt: "ASC" } });
  });

  it("does not publish an order change when saving status fails", async () => {
    const events = { emit: jest.fn() };
    const service = new OrdersService({ findOne: async () => orderFixture(), save: async () => { throw new Error("save failed"); } } as never, {} as never, events as never);
    await expect(service.updateStatus("order", "completed")).rejects.toThrow("save failed");
    expect(events.emit).not.toHaveBeenCalled();
  });

  it("does not publish a session close when saving fails, or repeat an already closed session", async () => {
    const session = sessionFixture();
    const repo = { findOne: jest.fn(async () => session), save: jest.fn(async () => { throw new Error("save failed"); }) };
    const events = { emit: jest.fn() };
    const service = new SessionsService(repo as never, {} as never, events as never);
    await expect(service.close(SESSION_ID)).rejects.toThrow("save failed");
    expect(events.emit).not.toHaveBeenCalled();
    repo.save.mockClear();
    session.status = "closed";
    await expect(service.close(SESSION_ID)).resolves.toBe(session);
    expect(repo.save).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });

  it("publishes basket updates only after deletion succeeds", async () => {
    const events = { emit: jest.fn() };
    const repo = { delete: jest.fn(async () => { throw new Error("delete failed"); }), find: jest.fn() };
    const service = new BasketItemsService(repo as never, {} as never, events as never);
    await expect(service.clear(SESSION_ID)).rejects.toThrow("delete failed");
    expect(events.emit).not.toHaveBeenCalled();
    expect(repo.find).not.toHaveBeenCalled();
  });
});
