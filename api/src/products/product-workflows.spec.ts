import { Repository } from "typeorm";
import { ProductsService } from "./products.service";
import { ProductsRepository } from "./products.repository";
import { ProductSaucesService } from "./product-sauces.service";
import { ProductImagesService } from "./product-images.service";
import { Product } from "../entities/product.entity";
import { productFixture } from "../contracts/fixtures";

describe("Product workflow compatibility", () => {
  let product: Product;
  const productRepo = { find: jest.fn(), findOne: jest.fn(), findOneOrFail: jest.fn(), save: jest.fn(), create: jest.fn() };
  const sauceRepo = { findBy: jest.fn() };
  const linksRepo = { delete: jest.fn(), create: jest.fn(), save: jest.fn() };
  let service: ProductsService;
  let repository: ProductsRepository;
  const events = { emit: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
    product = productFixture();
    productRepo.findOne.mockResolvedValue(product);
    productRepo.findOneOrFail.mockResolvedValue(product);
    productRepo.save.mockImplementation(async (value) => value);
    repository = new ProductsRepository(productRepo as unknown as Repository<Product>, { findOne: async () => product.category } as never, {} as never);
    service = new ProductsService(repository, new ProductSaucesService(linksRepo as never, sauceRepo as never), new ProductImagesService(productRepo as never), events as never);
  });

  it("preserves query relations, sorting and active-menu predicates", async () => {
    await repository.findAll();
    expect(productRepo.find).toHaveBeenLastCalledWith({ relations: { category: true, sauceLinks: { sauce: true } }, order: { title: "ASC" } });
    await repository.findPublicMenu();
    expect(productRepo.find).toHaveBeenLastCalledWith({ where: { category: { isActive: true } }, relations: { category: true, sauceLinks: { sauce: true } }, order: { category: { sortOrder: "ASC" }, title: "ASC" } });
    await repository.findOneWithDetails(product.id);
    expect(productRepo.findOneOrFail).toHaveBeenLastCalledWith({ where: { id: product.id }, relations: { category: true, sauceLinks: { sauce: true } } });
  });

  it("keeps translated-field replacement distinct from legacy English updates", async () => {
    await service.update(product.id, { title: " New title ", descriptionTranslations: { am: " Նոր " }, stockQuantity: 7 });
    expect(product.titleTranslations).toEqual({ en: "New title", ru: "Бургер" });
    expect(product.descriptionTranslations).toEqual({ am: "Նոր" });
    expect(product.description).toBe("Նոր");
    expect(product.stockQuantity).toBe(7);
    expect(linksRepo.delete).not.toHaveBeenCalled();
    expect(events.emit).toHaveBeenCalledWith("products:changed", {
      action: "updated",
      productId: product.id,
    });
  });

  it("preserves product metadata-only upload behavior and existing image bytes", async () => {
    product.imageData = Buffer.from("old image");
    await service.update(product.id, { image: { name: " renamed.png ", mimeType: " " } });
    expect(product.imageName).toBe("renamed.png");
    expect(product.imageMimeType).toBe("image/png");
    expect(product.imageData).toEqual(Buffer.from("old image"));
  });

  it("does not perform later relation writes after an earlier save failure", async () => {
    productRepo.save.mockRejectedValue(new Error("save failed"));
    await expect(service.update(product.id, { price: 900, sauceIds: [] })).rejects.toThrow("save failed");
    expect(sauceRepo.findBy).not.toHaveBeenCalled();
    expect(linksRepo.delete).not.toHaveBeenCalled();
  });

  it("preserves existing save-before-sauce-validation order (known non-atomic behavior)", async () => {
    // Fixing this is a separate behavior change; this refactor must not reorder writes.
    sauceRepo.findBy.mockResolvedValue([]);
    await expect(service.update(product.id, { price: 900, sauceIds: ["missing"] })).rejects.toThrow("One or more sauces do not exist");
    expect(productRepo.save).toHaveBeenCalledWith(expect.objectContaining({ price: 900 }));
    expect(linksRepo.delete).not.toHaveBeenCalled();
  });
});
