import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { SaucesService } from "./sauces.service";

describe("SaucesService", () => {
  const saucesRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  let service: SaucesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SaucesService(saucesRepo as never);
  });

  it("creates a sauce with its own price", async () => {
    saucesRepo.findOne.mockResolvedValue(null);
    saucesRepo.create.mockImplementation((value) => value);
    saucesRepo.save.mockImplementation(async (value) => ({
      ...value,
      id: "sauce-1",
    }));

    await expect(
      service.create({ name: " Garlic ", price: 300 }),
    ).resolves.toEqual(
      expect.objectContaining({ name: "Garlic", price: 300, isActive: true }),
    );
  });

  it("does not create a duplicate sauce", async () => {
    saucesRepo.findOne.mockResolvedValue({ id: "sauce-1" });

    await expect(
      service.create({ name: "Garlic", price: 300 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("does not create a sauce with a whitespace-only name", async () => {
    await expect(service.create({ name: "   ", price: 300 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(saucesRepo.save).not.toHaveBeenCalled();
  });

  it("rejects an empty update", async () => {
    saucesRepo.findOne.mockResolvedValue({
      id: "sauce-1",
      name: "Garlic",
      price: 300,
      isActive: true,
    });

    await expect(service.update("sauce-1", {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects an update for a missing sauce", async () => {
    saucesRepo.findOne.mockResolvedValue(null);

    await expect(
      service.update("missing", { price: 500 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("deletes a sauce and its product links", async () => {
    saucesRepo.delete.mockResolvedValue({ affected: 1 });

    await expect(service.remove("sauce-1")).resolves.toEqual({
      success: true,
    });
    expect(saucesRepo.delete).toHaveBeenCalledWith("sauce-1");
  });
});
