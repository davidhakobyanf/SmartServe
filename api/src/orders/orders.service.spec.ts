import { BadRequestException } from "@nestjs/common";
import { BasketItem } from "src/entities/basket-item.entity";
import { DiningSession } from "src/entities/dining-session.entity";
import { Order } from "src/entities/order.entity";
import { OrderItem } from "src/entities/order-item.entity";
import { SESSION_DOMAIN_EVENTS } from "src/sessions/session.events";
import { ORDER_DOMAIN_EVENTS } from "./order.events";
import { OrdersService } from "./orders.service";

describe("OrdersService", () => {
  const ordersRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const sessionsRepo = { findOne: jest.fn() };
  const basketItemsRepo = { find: jest.fn(), delete: jest.fn() };
  const transactionOrdersRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOneOrFail: jest.fn(),
  };
  const orderItemsRepo = { create: jest.fn(), save: jest.fn() };
  const manager = {
    getRepository: jest.fn((entity) => {
      if (entity === DiningSession) return sessionsRepo;
      if (entity === BasketItem) return basketItemsRepo;
      if (entity === Order) return transactionOrdersRepo;
      if (entity === OrderItem) return orderItemsRepo;
      throw new Error("Unexpected repository");
    }),
  };
  const dataSource = {
    transaction: jest.fn(async (callback) => callback(manager)),
  };
  const events = { emit: jest.fn() };
  let service: OrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    ordersRepo.find.mockResolvedValue([]);
    service = new OrdersService(
      ordersRepo as never,
      dataSource as never,
      events as never,
    );
  });

  it("creates snapshot items, calculates total and clears the basket", async () => {
    const session = { id: "session-1", tableId: "table-1", status: "open" };
    const basketItem = {
      productId: "product-1",
      product: { title: "Burger", description: "Beef" },
      unitPrice: 1000,
      sauces: [
        { id: "garlic-id", name: "Garlic", unitPrice: 300 },
        { id: "chili-id", name: "Chili", unitPrice: 400 },
      ],
      quantity: 2,
    };
    sessionsRepo.findOne.mockResolvedValue(session);
    basketItemsRepo.find.mockResolvedValue([basketItem]);
    transactionOrdersRepo.create.mockImplementation((value) => value);
    orderItemsRepo.create.mockImplementation((value) => value);
    orderItemsRepo.save.mockImplementation(async (value) => value);
    transactionOrdersRepo.save.mockImplementation(async (value) => ({
      ...value,
      id: "order-1",
    }));
    const completeOrder = { id: "order-1", items: [], total: 3400 };
    transactionOrdersRepo.findOneOrFail.mockResolvedValue(completeOrder);

    await expect(service.createFromBasket("session-1")).resolves.toBe(
      completeOrder,
    );
    expect(transactionOrdersRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ total: 3400, status: "placed" }),
    );
    expect(orderItemsRepo.save).toHaveBeenCalledWith([
      expect.objectContaining({
        orderId: "order-1",
        productId: "product-1",
        lineTotal: 3400,
      }),
    ]);
    expect(basketItemsRepo.delete).toHaveBeenCalledWith({
      sessionId: "session-1",
    });
    expect(events.emit).toHaveBeenCalledWith(
      SESSION_DOMAIN_EVENTS.BASKET_CHANGED,
      { sessionId: "session-1", items: [] },
    );
    expect(events.emit).toHaveBeenCalledWith(ORDER_DOMAIN_EVENTS.CHANGED, []);
  });

  it("does not create an order from an empty basket", async () => {
    sessionsRepo.findOne.mockResolvedValue({
      id: "session-1",
      tableId: "table-1",
      status: "open",
    });
    basketItemsRepo.find.mockResolvedValue([]);

    await expect(service.createFromBasket("session-1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(transactionOrdersRepo.save).not.toHaveBeenCalled();
  });

  it("marks a completed order with completion time", async () => {
    const order = { id: "order-1", status: "placed", completedAt: null };
    ordersRepo.findOne.mockResolvedValue(order);
    ordersRepo.save.mockImplementation(async (value) => value);

    const result = await service.updateStatus("order-1", "completed");

    expect(result.status).toBe("completed");
    expect(result.completedAt).toBeInstanceOf(Date);
    expect(events.emit).toHaveBeenCalledWith(ORDER_DOMAIN_EVENTS.CHANGED, []);
  });

  it.each(["preparing", "ready"] as const)("saves %s without marking the order completed", async (status) => {
    const order = { id: "order-1", status: "placed", completedAt: null };
    ordersRepo.findOne.mockResolvedValue(order);
    ordersRepo.save.mockImplementation(async (value) => value);
    const result = await service.updateStatus("order-1", status);
    expect(result.status).toBe(status);
    expect(result.completedAt).toBeNull();
    expect(events.emit).toHaveBeenCalledWith(ORDER_DOMAIN_EVENTS.CHANGED, []);
  });
});
