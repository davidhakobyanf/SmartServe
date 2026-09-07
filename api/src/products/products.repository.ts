import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { Product } from "../entities/product.entity";
import { Category } from "../entities/category.entity";
import { BasketItem } from "../entities/basket-item.entity";

// Named queries preserve relation loading and ordering at the persistence boundary.
@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product) private readonly productsRepo: Repository<Product>,
    @InjectRepository(Category) private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(BasketItem) private readonly basketItemsRepo: Repository<BasketItem>,
  ) {}

  findOneWithDetails(id: string): Promise<Product> {
    return this.productsRepo.findOneOrFail({
      where: { id },
      relations: {
        category: true,
        sauceLinks: {
          sauce: true,
        },
      },
    });
  }

  findAll(): Promise<Product[]> {
    return this.productsRepo.find({
      relations: {
        category: true,
        sauceLinks: {
          sauce: true,
        },
      },
      order: {
        title: "ASC",
      },
    });
  }

  findActiveMenu(): Promise<Product[]> {
    return this.productsRepo.find({
      where: {
        isActive: true,
        category: {
          isActive: true,
        },
      },
      relations: {
        category: true,
        sauceLinks: {
          sauce: true,
        },
      },
      order: {
        category: {
          sortOrder: "ASC",
        },
        title: "ASC",
      },
    });
  }

  findById(id: string): Promise<Product | null> {
    return this.productsRepo.findOne({ where: { id } });
  }

  findForUpdate(id: string): Promise<Product | null> {
    return this.productsRepo.findOne({ where: { id }, relations: { category: true } });
  }

  findCategory(id: string): Promise<Category | null> {
    return this.categoriesRepo.findOne({ where: { id } });
  }

  countBasketItems(productId: string): Promise<number> {
    return this.basketItemsRepo.count({ where: { productId } });
  }

  create(input: DeepPartial<Product>): Product {
    return this.productsRepo.create(input);
  }

  save(product: Product): Promise<Product> {
    return this.productsRepo.save(product);
  }

  delete(id: string) {
    return this.productsRepo.delete(id);
  }
}
