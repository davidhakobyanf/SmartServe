import { BadRequestException, ConflictException } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsRepository } from "./products.repository";
import { ProductSaucesService } from "./product-sauces.service";
import { ProductImagesService } from "./product-images.service";

describe("ProductsService", () => {
  const productsRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    delete: jest.fn(),
  };
  const categoriesRepo = { findOne: jest.fn() };
  const productSaucesRepo = {
    delete: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const saucesRepo = { findBy: jest.fn() };
  const basketItemsRepo = { count: jest.fn() };
  const events = { emit: jest.fn() };

  let service: ProductsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductsService(
      new ProductsRepository(productsRepo as never, categoriesRepo as never, basketItemsRepo as never),
      new ProductSaucesService(productSaucesRepo as never, saucesRepo as never),
      new ProductImagesService(productsRepo as never),
      events as never,
    );
  });

  it("creates links between a product and its sauces", async () => {
    const category = { id: "category-1", name: "Burgers" };
    const detailedProduct = {
      id: "product-1",
      sauceLinks: [
        { sauce: { id: "sauce-1", name: "Garlic", price: 300 } },
        { sauce: { id: "sauce-2", name: "BBQ", price: 450 } },
      ],
    };

    categoriesRepo.findOne.mockResolvedValue(category);
    saucesRepo.findBy.mockResolvedValue([
      { id: "sauce-1" },
      { id: "sauce-2" },
    ]);
    productsRepo.create.mockImplementation((value) => value);
    productsRepo.save.mockImplementation(async (value) => ({
      ...value,
      id: "product-1",
    }));
    productsRepo.findOneOrFail.mockResolvedValue(detailedProduct);
    productSaucesRepo.create.mockImplementation((value) => value);
    productSaucesRepo.save.mockImplementation(async (value) => value);

    await expect(
      service.create({
        categoryId: category.id,
        title: " Burger ",
        price: 2000,
        stockQuantity: 8,
        sauceIds: ["sauce-2", "sauce-1", "sauce-1"],
      }),
    ).resolves.toBe(detailedProduct);

    expect(productSaucesRepo.delete).toHaveBeenCalledWith({
      productId: "product-1",
    });
    expect(productSaucesRepo.save).toHaveBeenCalledWith([
      { productId: "product-1", sauceId: "sauce-1" },
      { productId: "product-1", sauceId: "sauce-2" },
    ]);
    expect(productsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ stockQuantity: 8 }),
    );
    expect(events.emit).toHaveBeenCalledWith("products:changed", {
      action: "created",
      productId: "product-1",
    });
  });

  it("rejects a product when one of its sauces does not exist", async () => {
    categoriesRepo.findOne.mockResolvedValue({ id: "category-1" });
    saucesRepo.findBy.mockResolvedValue([{ id: "sauce-1" }]);

    await expect(
      service.create({
        categoryId: "category-1",
        title: "Burger",
        price: 2000,
        sauceIds: ["sauce-1", "missing-sauce"],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(productsRepo.save).not.toHaveBeenCalled();
  });

  it("does not delete a product that is still in a guest basket", async () => {
    productsRepo.findOne.mockResolvedValue({ id: "product-1" });
    basketItemsRepo.count.mockResolvedValue(1);

    await expect(service.remove("product-1")).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(productsRepo.delete).not.toHaveBeenCalled();
  });

  it("deletes a product that is not in a guest basket", async () => {
    productsRepo.findOne.mockResolvedValue({ id: "product-1" });
    basketItemsRepo.count.mockResolvedValue(0);
    productsRepo.delete.mockResolvedValue({ affected: 1 });

    await expect(service.remove("product-1")).resolves.toEqual({
      success: true,
    });
    expect(productsRepo.delete).toHaveBeenCalledWith("product-1");
    expect(events.emit).toHaveBeenCalledWith("products:changed", {
      action: "deleted",
      productId: "product-1",
    });
  });
});
