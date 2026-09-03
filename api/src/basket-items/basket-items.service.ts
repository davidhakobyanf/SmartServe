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
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import {
  SESSION_DOMAIN_EVENTS,
  SessionClosedPayload,
} from "src/sessions/session.events";
import { SauceSnapshot } from "src/common/types/sauce-snapshot";

@Injectable()
export class BasketItemsService {
  constructor(
    @InjectRepository(BasketItem)
    private readonly basketItemsRepo: Repository<BasketItem>,

    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,

    private readonly events: EventEmitter2,
  ) {}

  private async notifyBasketChanged(sessionId: string): Promise<void> {
    this.events.emit(SESSION_DOMAIN_EVENTS.BASKET_CHANGED, {
      sessionId,
      items: await this.findAll(sessionId),
    });
  }

  private normalizeSauceIds(sauceIds: string[] = []): string[] {
    return [...new Set(sauceIds)].sort();
  }

  private resolveSauces(
    product: Product,
    sauceIds: string[],
  ): SauceSnapshot[] {
    const activeSauces = new Map(
      (product.sauceLinks ?? [])
        .map((link) => link.sauce)
        .filter((sauce) => sauce.isActive)
        .map((sauce) => [sauce.id, sauce]),
    );
    if (sauceIds.some((sauceId) => !activeSauces.has(sauceId))) {
      throw new BadRequestException("Invalid sauce for this product");
    }

    return sauceIds.map((sauceId) => {
      const sauce = activeSauces.get(sauceId)!;
      return {
        id: sauce.id,
        name: sauce.name,
        unitPrice: sauce.price,
      };
    });
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
        sauceLinks: {
          sauce: true,
        },
      },
    });

    if (!product) {
      throw new NotFoundException("Product is unavailable");
    }

    const sauceIds = this.normalizeSauceIds(dto.sauceIds);
    const sauces = this.resolveSauces(product, sauceIds);

    const sameProductItems = await this.basketItemsRepo.find({
      where: {
        sessionId,
        productId: product.id,
      },
    });

    const existingItem = sameProductItems.find(
      (item) =>
        JSON.stringify(item.sauces.map((sauce) => sauce.id).sort()) ===
        JSON.stringify(sauceIds),
    );

    const quantity = dto.quantity ?? 1;

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > 99) {
        throw new BadRequestException("Maximum quantity is 99");
      }

      existingItem.quantity = newQuantity;
      const savedItem = await this.basketItemsRepo.save(existingItem);
      await this.notifyBasketChanged(sessionId);
      return savedItem;
    }

    const item = this.basketItemsRepo.create({
      sessionId,
      productId: product.id,
      product,
      quantity,
      sauces,
      unitPrice: product.price,
    });
    const savedItem = await this.basketItemsRepo.save(item);
    await this.notifyBasketChanged(sessionId);
    return savedItem;
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
          sauceLinks: {
            sauce: true,
          },
        },
      },
    });
    if (!item) {
      throw new NotFoundException("Basket item not found");
    }

    if (dto.quantity !== undefined) {
      item.quantity = dto.quantity;
    }

    if (dto.sauceIds !== undefined) {
      const sauceIds = this.normalizeSauceIds(dto.sauceIds);
      item.sauces = this.resolveSauces(item.product, sauceIds);
    }
    const savedItem = await this.basketItemsRepo.save(item);
    await this.notifyBasketChanged(sessionId);
    return savedItem;
  }

  async remove(sessionId: string, itemId: string): Promise<{ success: true }> {
    const result = await this.basketItemsRepo.delete({
      id: itemId,
      sessionId,
    });

    if (!result.affected) {
      throw new NotFoundException("Basket item not found");
    }

    await this.notifyBasketChanged(sessionId);
    return { success: true };
  }
  async clear(sessionId: string): Promise<{ success: true }> {
    await this.basketItemsRepo.delete({ sessionId });
    await this.notifyBasketChanged(sessionId);
    return { success: true };
  }

  @OnEvent(SESSION_DOMAIN_EVENTS.CLOSED)
  async onSessionClosed(payload: SessionClosedPayload): Promise<void> {
    await this.basketItemsRepo.delete({
      sessionId: payload.sessionId,
    });
  }
}
