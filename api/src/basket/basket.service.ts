import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasketStore } from '../entities/basket-store.entity';
import type { BasketTables, MenuCard } from '../common/types/menu-card';
import { AddBasketItemDto } from './dto/basket.dto';

@Injectable()
export class BasketService {
  constructor(
    @InjectRepository(BasketStore)
    private readonly basketRepo: Repository<BasketStore>,
  ) {}

  private async getOrCreateStore(): Promise<BasketStore> {
    let store = await this.basketRepo.findOne({ where: { id: 1 } });
    if (!store) {
      store = this.basketRepo.create({ id: 1, tables: {} });
      await this.basketRepo.save(store);
    }
    return store;
  }

  async getTables(): Promise<BasketTables> {
    const store = await this.basketRepo.findOne({ where: { id: 1 } });
    if (!store?.tables || Object.keys(store.tables).length === 0) {
      throw new NotFoundException({ error: 'Basket not found' });
    }
    return store.tables;
  }

  async addItem(dto: AddBasketItemDto) {
    const card: MenuCard = {
      id: dto.id,
      description: dto.description,
      image: (dto.image ?? {}) as MenuCard['image'],
      price: Number(dto.price),
      sauces: dto.sauces ?? [],
      title: dto.title,
      active: dto.active ?? true,
      table: dto.table,
      count: dto.count,
    };

    const store = await this.getOrCreateStore();
    const tables = { ...(store.tables ?? {}) };
    const tableKey = String(dto.table);

    if (!tables[tableKey]) {
      tables[tableKey] = [card];
    } else {
      let found = false;
      tables[tableKey] = tables[tableKey].map((existing) => {
        if (
          existing.id === card.id &&
          JSON.stringify(existing.sauces) === JSON.stringify(card.sauces)
        ) {
          found = true;
          return {
            ...existing,
            count: (existing.count ?? 0) + (card.count ?? 1),
          };
        }
        return existing;
      });
      if (!found) {
        tables[tableKey].push(card);
      }
    }

    store.tables = tables;
    await this.basketRepo.save(store);
    return store;
  }

  async deleteItem(table: string, id: string) {
    const store = await this.getOrCreateStore();
    const tableKey = String(table);
    const tables = { ...(store.tables ?? {}) };

    if (!tables[tableKey]) {
      throw new NotFoundException({
        error: 'Карта не найдена или что-то пошло не так',
      });
    }

    tables[tableKey] = tables[tableKey].filter((item) => item.id !== id);
    store.tables = tables;
    await this.basketRepo.save(store);
    return store;
  }

  async deleteAllForTable(table: string) {
    const store = await this.getOrCreateStore();
    const tables = { ...(store.tables ?? {}) };
    const tableKey = String(table);

    if (!(tableKey in tables)) {
      throw new NotFoundException({
        error: 'Стол не найден или что-то пошло не так',
      });
    }

    delete tables[tableKey];
    store.tables = tables;
    await this.basketRepo.save(store);
    return store;
  }

  async removeCardFromAllTables(cardId: string) {
    const store = await this.basketRepo.findOne({ where: { id: 1 } });
    if (!store?.tables) return;

    const tables = { ...store.tables };
    for (const key of Object.keys(tables)) {
      tables[key] = tables[key].filter((item) => item.id !== cardId);
    }
    store.tables = tables;
    await this.basketRepo.save(store);
  }
}
