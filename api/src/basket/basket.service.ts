import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasketStore } from '../entities/basket-store.entity';
import type { BasketTables, MenuCard } from '../common/types/menu-card';
import { AddBasketItemDto } from './dto/basket.dto';
import { SESSION_DOMAIN_EVENTS, SessionClosedPayload } from 'src/sessions/session.events';
import { OnEvent } from '@nestjs/event-emitter';


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
  async getTableBasket(table: string): Promise<MenuCard[]> {
    const store = await this.basketRepo.findOne({ where: { id: 1 } });
    return store?.tables?.[String(table)] ?? [];
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

  async deleteItem(table: string, id: string, sauces?: string[]) {
    const store = await this.getOrCreateStore();
    const tableKey = String(table);
    const tables = { ...(store.tables ?? {}) };

    if (!tables[tableKey]) {
      throw new NotFoundException({
        error: 'Карта не найдена или что-то пошло не так',
      });
    }

    // A basket line is uniquely identified by id + sauces (addItem merges
    // identical ones). Remove exactly ONE matching line, so removing one
    // dish never wipes other lines that happen to share the same id.
    const target = sauces === undefined ? undefined : JSON.stringify(sauces);
    let removed = false;
    tables[tableKey] = tables[tableKey].filter((item) => {
      if (removed) return true;
      const match =
        item.id === id &&
        (target === undefined ||
          JSON.stringify(item.sauces ?? []) === target);
      if (match) {
        removed = true;
        return false;
      }
      return true;
    });

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

  async clearTable(table:string): Promise<void> {
    const store = await this.basketRepo.findOne({where: {id: 1}})
    const key = String(table);
    if (!store?.tables?.[key]) return;

    const tables = {...store.tables};
    delete tables[key];
    store.tables = tables;
    await this.basketRepo.save(store);
  }

  @OnEvent(SESSION_DOMAIN_EVENTS.CLOSED)
  async onSessionClosed(payload: SessionClosedPayload) {
    await this.clearTable(String(payload.tableNumber));
  }
}
