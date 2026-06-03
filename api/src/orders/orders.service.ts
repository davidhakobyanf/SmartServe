import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { OrderStore } from '../entities/order-store.entity';
import type { OrderRecord } from '../common/types/menu-card';
import { CreateOrderDto } from './dto/order.dto';
import { OrderItemDto } from './dto/order-item.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderStore)
    private readonly orderRepo: Repository<OrderStore>,
  ) {}

  private async getOrCreateStore(): Promise<OrderStore> {
    let store = await this.orderRepo.findOne({ where: { id: 1 } });
    if (!store) {
      store = this.orderRepo.create({ id: 1, orders: [] });
      await this.orderRepo.save(store);
    }
    return store;
  }

  async getOrders(): Promise<OrderRecord[]> {
    const store = await this.getOrCreateStore();
    return store.orders ?? [];
  }

  private mapOrderItem(item: OrderItemDto) {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      price: Number(item.price),
      sauces: item.sauces ?? [],
      active: item.active ?? true,
      image: item.image ?? { name: '' },
      count: Number(item.count) || 1,
    };
  }

  async addOrder(dto: CreateOrderDto) {
    const store = await this.getOrCreateStore();
    const newOrder: OrderRecord = {
      _id: uuidv4(),
      items: dto.items.map((item) => this.mapOrderItem(item)),
      allPrice: Number(dto.allPrice),
      table: dto.table,
      createdAt: new Date().toISOString(),
    };

    store.orders = [...(store.orders ?? []), newOrder];
    await this.orderRepo.save(store);

    return { message: 'New order added successfully', order: newOrder };
  }

  async deleteOrder(id: string) {
    const store = await this.getOrCreateStore();
    const before = store.orders?.length ?? 0;
    store.orders = (store.orders ?? []).filter((o) => o._id !== id);

    if (store.orders.length === before) {
      throw new NotFoundException({
        error: 'Заказ не найден или что-то пошло не так',
      });
    }

    await this.orderRepo.save(store);
    return store;
  }

  async deleteAllOrders() {
    const store = await this.orderRepo.findOne({ where: { id: 1 } });
    if (!store) {
      throw new NotFoundException({
        error: 'Данные не найдены или что-то пошло не так',
      });
    }

    store.orders = [];
    await this.orderRepo.save(store);
    return { message: "Данные в массиве 'orders' были удалены" };
  }
}
