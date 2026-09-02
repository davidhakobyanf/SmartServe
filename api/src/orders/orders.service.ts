import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { BasketItem } from "src/entities/basket-item.entity";
import { DiningSession } from "src/entities/dining-session.entity";
import { Order, OrderStatus } from "src/entities/order.entity";
import { OrderItem } from "src/entities/order-item.entity";
import { DataSource, Repository } from "typeorm";
import { DOMAIN_EVENTS } from "./orders.gateway";

const SAUCE_UNIT_PRICE = 350;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly events: EventEmitter2,
  ) {}

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private async notifyOrdersChanged(): Promise<void> {
    this.events.emit(DOMAIN_EVENTS.ORDERS_CHANGED, await this.findAll());
  }

  findAll(): Promise<Order[]> {
    return this.ordersRepo.find({
      relations: {
        table: true,
        session: true,
        items: {
          product: true,
        },
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  findForSession(sessionId: string): Promise<Order[]> {
    return this.ordersRepo.find({
      where: { sessionId },
      relations: {
        items: {
          product: true,
        },
      },
      order: {
        createdAt: "DESC",
      },
    });
  }

  async createFromBasket(sessionId: string): Promise<Order> {
    const order = await this.dataSource.transaction(async (manager) => {
      const sessionsRepo = manager.getRepository(DiningSession);
      const basketItemsRepo = manager.getRepository(BasketItem);
      const ordersRepo = manager.getRepository(Order);
      const orderItemsRepo = manager.getRepository(OrderItem);

      const session = await sessionsRepo.findOne({
        where: { id: sessionId },
        lock: { mode: "pessimistic_write" },
      });

      if (!session || session.status !== "open") {
        throw new BadRequestException("Session is closed or invalid");
      }

      const basketItems = await basketItemsRepo.find({
        where: { sessionId },
        relations: {
          product: true,
        },
        order: {
          createdAt: "ASC",
        },
      });

      if (basketItems.length === 0) {
        throw new BadRequestException("Basket is empty");
      }

      const newOrder = ordersRepo.create({
        tableId: session.tableId,
        sessionId: session.id,
        status: "placed",
        total: 0,
        completedAt: null,
      });

      newOrder.items = basketItems.map((basketItem) => {
        const lineTotal = this.roundMoney(
          (basketItem.unitPrice +
            SAUCE_UNIT_PRICE * basketItem.sauces.length) *
            basketItem.quantity,
        );

        return orderItemsRepo.create({
          order: newOrder,
          productId: basketItem.productId,
          product: basketItem.product,
          titleSnapshot: basketItem.product.title,
          descriptionSnapshot: basketItem.product.description,
          unitPrice: basketItem.unitPrice,
          quantity: basketItem.quantity,
          sauces: basketItem.sauces,
          lineTotal,
        });
      });

      newOrder.total = this.roundMoney(
        newOrder.items.reduce((sum, item) => sum + item.lineTotal, 0),
      );

      const savedOrder = await ordersRepo.save(newOrder);
      await basketItemsRepo.delete({ sessionId });

      return ordersRepo.findOneOrFail({
        where: { id: savedOrder.id },
        relations: {
          table: true,
          session: true,
          items: {
            product: true,
          },
        },
      });
    });

    await this.notifyOrdersChanged();
    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id },
      relations: {
        table: true,
        session: true,
        items: {
          product: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    order.status = status;
    order.completedAt = status === "completed" ? new Date() : null;

    const savedOrder = await this.ordersRepo.save(order);
    await this.notifyOrdersChanged();
    return savedOrder;
  }
}
