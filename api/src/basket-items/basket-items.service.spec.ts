import { BadRequestException } from "@nestjs/common";
import { BasketItemsService } from "./basket-items.service";
import { SESSION_DOMAIN_EVENTS } from "src/sessions/session.events";

describe("BasketItemsService", () => {
  const basketItemsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const productsRepo = { findOne: jest.fn() };
  const events = { emit: jest.fn() };

  let service: BasketItemsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BasketItemsService(
      basketItemsRepo as never,
      productsRepo as never,
      events as never,
    );
  });

  it("does not allow a sauce that the product does not have", async () => {
    productsRepo.findOne.mockResolvedValue({
      id: "product-1",
      sauces: ["Garlic"],
      price: 1000,
    });

    await expect(
      service.add("session-1", {
        productId: "product-1",
        sauces: ["Chili"],
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(basketItemsRepo.save).not.toHaveBeenCalled();
  });

  it("combines identical products and normalizes their sauces", async () => {
    const product = {
      id: "product-1",
      sauces: ["Garlic", "Chili"],
      price: 1000,
    };
    const existingItem = {
      id: "item-1",
      productId: product.id,
      sessionId: "session-1",
      sauces: ["Chili", "Garlic"],
      quantity: 2,
    };
    productsRepo.findOne.mockResolvedValue(product);
    basketItemsRepo.find
      .mockResolvedValueOnce([existingItem])
      .mockResolvedValueOnce([existingItem]);
    basketItemsRepo.save.mockImplementation(async (value) => value);

    const result = await service.add("session-1", {
      productId: product.id,
      sauces: [" Garlic ", "Chili", "Garlic"],
      quantity: 3,
    });

    expect(result.quantity).toBe(5);
    expect(basketItemsRepo.create).not.toHaveBeenCalled();
    expect(events.emit).toHaveBeenCalledWith(
      SESSION_DOMAIN_EVENTS.BASKET_CHANGED,
      expect.objectContaining({ sessionId: "session-1" }),
    );
  });

  it("deletes the basket automatically when the session closes", async () => {
    basketItemsRepo.delete.mockResolvedValue({ affected: 1 });

    await service.onSessionClosed({ sessionId: "session-1", tableNumber: 2 });

    expect(basketItemsRepo.delete).toHaveBeenCalledWith({
      sessionId: "session-1",
    });
  });
});
