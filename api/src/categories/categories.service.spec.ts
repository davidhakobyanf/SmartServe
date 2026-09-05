import { ConflictException } from "@nestjs/common";
import { CategoriesService } from "./categories.service";

describe("CategoriesService", () => {
  const categoryRepository = {
    findOne: jest.fn(),
    delete: jest.fn(),
  };
  const productsRepository = { count: jest.fn() };

  let service: CategoriesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CategoriesService(
      categoryRepository as never,
      productsRepository as never,
    );
  });

  it("does not delete a category that contains products", async () => {
    categoryRepository.findOne.mockResolvedValue({ id: "category-1" });
    productsRepository.count.mockResolvedValue(2);

    await expect(service.remove("category-1")).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(categoryRepository.delete).not.toHaveBeenCalled();
  });

  it("deletes an empty category", async () => {
    categoryRepository.findOne.mockResolvedValue({ id: "category-1" });
    productsRepository.count.mockResolvedValue(0);
    categoryRepository.delete.mockResolvedValue({ affected: 1 });

    await expect(service.remove("category-1")).resolves.toEqual({
      success: true,
    });
    expect(categoryRepository.delete).toHaveBeenCalledWith("category-1");
  });
});
