import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BasketItem } from "src/entities/basket-item.entity";
import { DiningSession } from 'src/entities/dining-session.entity';
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
import { matchesSauceSelection, normalizeSauceIds, selectSauceSnapshots } from "src/sauces/sauce-selection";

@Injectable()
export class BasketItemsService {
  private transactional = false;
  constructor(
    @InjectRepository(BasketItem)
    private readonly basketItemsRepo: Repository<BasketItem>,

    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,

    private readonly events: EventEmitter2,
  ) {}

  private async notifyBasketChanged(sessionId: string): Promise<void> {
    if (this.transactional) return; // Only the outer operation emits, after COMMIT.
    this.events.emit(SESSION_DOMAIN_EVENTS.BASKET_CHANGED, {
      sessionId,
      items: await this.findAll(sessionId),
    });
  }

  private async withSessionLock<T>(sessionId: string, operation: (service: BasketItemsService) => Promise<T>): Promise<T> {
    const committed = await this.basketItemsRepo.manager.transaction(async manager => {
      const session = await manager.getRepository(DiningSession).findOne({where:{id:sessionId},lock:{mode:'pessimistic_write'}});
      if (!session || session.status !== 'open') throw new BadRequestException('Session is closed or invalid');
      const scoped = new BasketItemsService(manager.getRepository(BasketItem), manager.getRepository(Product), this.events);
      scoped.transactional = true;
      const result = await operation(scoped);
      return { result, items: await scoped.findAll(sessionId) };
    });
    this.events.emit(SESSION_DOMAIN_EVENTS.BASKET_CHANGED, { sessionId, items: committed.items });
    return committed.result;
  }

  private resolveSauces(
    product: Product,
    sauceIds: string[],
  ): SauceSnapshot[] {
    const sauces = selectSauceSnapshots(product.sauceLinks, sauceIds);
    if (sauces === null) {
      throw new BadRequestException("Invalid sauce for this product");
    }
    return sauces;
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
    if (!this.transactional) return this.withSessionLock(sessionId, service => service.add(sessionId, dto));
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

    const sauceIds = normalizeSauceIds(dto.sauceIds);
    const sauces = this.resolveSauces(product, sauceIds);

    const sameProductItems = await this.basketItemsRepo.find({
      where: {
        sessionId,
        productId: product.id,
      },
    });

    const existingItem = sameProductItems.find(
      (item) => matchesSauceSelection(item.sauces, sauceIds),
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
    if (!this.transactional) return this.withSessionLock(sessionId, service => service.update(sessionId, itemId, dto));
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
      const sauceIds = normalizeSauceIds(dto.sauceIds);
      item.sauces = this.resolveSauces(item.product, sauceIds);
    }
    const savedItem = await this.basketItemsRepo.save(item);
    await this.notifyBasketChanged(sessionId);
    return savedItem;
  }

  async remove(sessionId: string, itemId: string): Promise<{ success: true }> {
    if (!this.transactional) return this.withSessionLock(sessionId, service => service.remove(sessionId, itemId));
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
    if (!this.transactional) return this.withSessionLock(sessionId, service => service.clear(sessionId));
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
