import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BasketItem } from "src/entities/basket-item.entity";
import { Product } from "src/entities/product.entity";
import { Repository } from "typeorm";
import { AddBasketItemDto } from "./dto/add-basket-item.dto";
import { UpdateBasketItemDto } from "./dto/update-basket-item.dto";
import { OnEvent } from "@nestjs/event-emitter";
import {
  SESSION_DOMAIN_EVENTS,
  SessionClosedPayload,
} from "src/sessions/session.events";

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

  private validateSauces(product: Product, sauces: string[]): void {
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

  async add(sessionId: string, dto: AddBasketItemDto): Promise<BasketItem> {
    const product = await this.productsRepo.findOne({
      where: {
        id: dto.productId,
        isActive: true,
        category: {
          isActive: true,
        },
      },
      relations: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException("Product is unavailable");
    }

    const sauces = this.normalizeSauces(dto.sauces);
    this.validateSauces(product, sauces);

    const sameProductItems = await this.basketItemsRepo.find({
      where: {
        sessionId,
        productId: product.id,
      },
    });

    const existingItem = sameProductItems.find(
      (item) => JSON.stringify(item.sauces) === JSON.stringify(sauces),
    );

    const quantity = dto.quantity ?? 1;

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > 99) {
        throw new BadRequestException("Maximum quantity is 99");
      }

      existingItem.quantity = newQuantity;
      return this.basketItemsRepo.save(existingItem);
    }

    const item = this.basketItemsRepo.create({
      sessionId,
      productId: product.id,
      product,
      quantity,
      sauces,
      unitPrice: product.price,
    });
    return this.basketItemsRepo.save(item);
  }

  async update(
    sessionId: string,
    itemId: string,
    dto: UpdateBasketItemDto,
  ): Promise<BasketItem> {
    const item = await this.basketItemsRepo.findOne({
      where: {
        id: itemId,
        sessionId,
      },
      relations: {
        product: {
          category: true,
        },
      },
    });
    if (!item) {
      throw new NotFoundException("Basket item not found");
    }

    if (dto.quantity !== undefined) {
      item.quantity = dto.quantity;
    }

    if (dto.sauces !== undefined) {
      const sauces = this.normalizeSauces(dto.sauces);
      this.validateSauces(item.product, sauces);
      item.sauces = sauces;
    }
    return this.basketItemsRepo.save(item);
  }

  async remove(sessionId: string, itemId: string): Promise<{ success: true }> {
    const result = await this.basketItemsRepo.delete({
      id: itemId,
      sessionId,
    });

    if (!result.affected) {
      throw new NotFoundException("Basket item not found");
    }

    return { success: true };
  }
  async clear(sessionId: string): Promise<{ success: true }> {
    await this.basketItemsRepo.delete({ sessionId });
    return { success: true };
  }

  @OnEvent(SESSION_DOMAIN_EVENTS.CLOSED)
  async onSessionClosed(payload: SessionClosedPayload): Promise<void> {
    await this.basketItemsRepo.delete({
      sessionId: payload.sessionId,
    });
  }
}
