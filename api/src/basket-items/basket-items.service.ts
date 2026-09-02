import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BasketItem } from "src/entities/basket-item.entity";
import { Product } from "src/entities/product.entity";
import { Repository } from "typeorm";

@Injectable()
export class BasketItemsService {
  constructor(
    @InjectRepository(BasketItem)
    private readonly basketItemsRepo: Repository<BasketItem>,

    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  private normalizeSauces(sauces: string[] = []): string[] {
    return [
      ...new Set(sauces.map((sauce) => sauce.trim()).filter(Boolean)),
    ].sort();
  }

  private validateSouces(product: Product, sauces: string[]): void {
    const allowedSauces = new Set(product.sauces.map((sauce) => sauce.trim()));

    const hasInvalidSauce = sauces.some((sauce) => !allowedSauces.has(sauce));

    if (hasInvalidSauce) {
      throw new BadRequestException("Invalid sauce for this product");
    }
  }
  findAll(sessionId: string): Promise<BasketItem[]> {
    return this.basketItemsRepo.find({
      where: { sessionId },
      relations: {
        product: {
          category: true,
        },
      },
      order: {
        createdAt: "ASC",
      },
    });
  }

  
}
