import { BadRequestException } from "@nestjs/common";
import { BasketItemsService } from "./basket-items.service";
import { SESSION_DOMAIN_EVENTS } from "src/sessions/session.events";
import { BasketItem } from 'src/entities/basket-item.entity';
import { Product } from 'src/entities/product.entity';
import { DiningSession } from 'src/entities/dining-session.entity';

describe("BasketItemsService", () => {
  const basketItemsRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    manager: { transaction: jest.fn() },
  };
  const productsRepo = { findOne: jest.fn() };
  const events = { emit: jest.fn() };

  let service: BasketItemsService;

  beforeEach(() => {
    jest.clearAllMocks();
    basketItemsRepo.manager.transaction.mockImplementation(async callback => callback({ getRepository: (entity: unknown) => {
      if (entity === BasketItem) return basketItemsRepo;
      if (entity === Product) return productsRepo;
      if (entity === DiningSession) return {findOne:async()=>({status:'open'})};
      throw new Error('Unexpected repository');
    } }));
    service = new BasketItemsService(
      basketItemsRepo as never,
      productsRepo as never,
      events as never,
    );
  });

  it("does not allow a sauce that the product does not have", async () => {
    productsRepo.findOne.mockResolvedValue({
      id: "product-1",
      sauceLinks: [
        {
          sauce: {
            id: "garlic-id",
            name: "Garlic",
            price: 300,
            isActive: true,
          },
        },
      ],
      price: 1000,
    });

    await expect(
      service.add("session-1", {
        productId: "product-1",
        sauceIds: ["chili-id"],
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(basketItemsRepo.save).not.toHaveBeenCalled();
  });

  it("combines identical products and normalizes their sauces", async () => {
    const product = {
      id: "product-1",
      sauceLinks: [
        {
          sauce: {
            id: "garlic-id",
            name: "Garlic",
            price: 300,
            isActive: true,
          },
        },
        {
          sauce: {
            id: "chili-id",
            name: "Chili",
            price: 400,
            isActive: true,
          },
        },
      ],
      price: 1000,
    };
    const existingItem = {
      id: "item-1",
      productId: product.id,
      sessionId: "session-1",
      sauces: [
        { id: "chili-id", name: "Chili", unitPrice: 400 },
        { id: "garlic-id", name: "Garlic", unitPrice: 300 },
      ],
      quantity: 2,
    };
    productsRepo.findOne.mockResolvedValue(product);
    basketItemsRepo.find
      .mockResolvedValueOnce([existingItem])
      .mockResolvedValueOnce([existingItem]);
    basketItemsRepo.save.mockImplementation(async (value) => value);

    const result = await service.add("session-1", {
      productId: product.id,
      sauceIds: ["garlic-id", "chili-id", "garlic-id"],
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
  it('does not publish a snapshot if COMMIT fails', async () => {
    basketItemsRepo.delete.mockResolvedValue({affected:1});
    basketItemsRepo.find.mockResolvedValue([]);
    basketItemsRepo.manager.transaction.mockImplementation(async callback => {
      await callback({getRepository:(entity:unknown)=>entity===BasketItem?basketItemsRepo:{findOne:async()=>({status:'open'})}});
      throw new Error('commit failed');
    });
    await expect(service.clear('session-1')).rejects.toThrow('commit failed');
    expect(events.emit).not.toHaveBeenCalled();
  });
  it('locks and rechecks the session inside the transaction', async () => {
    const findOne=jest.fn(async()=>({status:'closed'}));
    basketItemsRepo.manager.transaction.mockImplementation(async callback=>callback({getRepository:()=>({findOne})}));
    await expect(service.clear('session-1')).rejects.toThrow('Session is closed');
    expect(findOne).toHaveBeenCalledWith({where:{id:'session-1'},lock:{mode:'pessimistic_write'}});
    expect(basketItemsRepo.delete).not.toHaveBeenCalled();
  });
});
