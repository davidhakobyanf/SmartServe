import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { MenuCard, MenuCardImage } from '../common/types/menu-card';
import { UsersService } from '../users/users.service';
import { BasketService } from '../basket/basket.service';
import { CreateMenuCardDto, UpdateMenuCardDto } from './dto/menu-card.dto';
import { sanitizeMenuCards } from '../common/utils/menu-card-response.util';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS } from './menu.gateway';

@Injectable()
export class MenuService {
  constructor(
    private readonly usersService: UsersService,
    private readonly basketService: BasketService,
    private readonly events:EventEmitter2
  ) {}

  async addCard(dto: CreateMenuCardDto) {
    const user = await this.usersService.getActiveUser();
    if (!user) {
      throw new NotFoundException({ err: 'something gonna wrong' });
    }

    const card: MenuCard = {
      id: uuidv4(),
      description: dto.description,
      image: this.normalizeImage(dto.image),
      price: Number(dto.price),
      sauces: dto.sauces ?? [],
      title: dto.title,
      active: dto.active ?? true,
    };

    user.cards = [...(user.cards ?? []), card];
    const saved = await this.usersService.saveUser(user);
    this.notifyMenuChanged(saved);
    return { ...saved, cards: sanitizeMenuCards(saved.cards) };
  }

  async deleteCard(id: string) {
    const user = await this.usersService.getActiveUser();
    if (!user) {
      throw new NotFoundException({ error: 'Card not found or something went wrong' });
    }

    user.cards = (user.cards ?? []).filter((c) => c.id !== id);
    const saved = await this.usersService.saveUser(user);
    await this.basketService.removeCardFromAllTables(id);
    this.notifyMenuChanged(saved);
    return { ...saved, cards: sanitizeMenuCards(saved.cards) };
  }

  async editCard(dto: UpdateMenuCardDto) {
    const user = await this.usersService.getActiveUser();
    if (!user) {
      throw new NotFoundException('Card not found');
    }

    const index = (user.cards ?? []).findIndex((c) => c.id === dto.id);
    if (index === -1) {
      throw new NotFoundException('Card not found');
    }

    const current = user.cards[index];
    const updated: MenuCard = {
      ...current,
      id: dto.id,
      description: dto.description,
      image: this.mergeImage(current.image, dto.image),
      price: Number(dto.price),
      sauces: dto.sauces ?? current.sauces,
      title: dto.title,
      active: dto.active ?? current.active,
    };

    user.cards[index] = updated;
    const saved = await this.usersService.saveUser(user);
    const cards = sanitizeMenuCards(saved.cards);
    this.notifyMenuChanged(saved);
    return {
      user: { ...saved, cards },
      profile: {
        name: saved.name,
        surname: saved.surname,
        card: cards,
      },
    };
  }

  async getCardImage(cardId: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const user = await this.usersService.getActiveUser();
    if (!user) {
      throw new NotFoundException({ error: 'Image not found' });
    }

    const card = (user.cards ?? []).find((c) => c.id === cardId);
    const image = card?.image as MenuCardImage | undefined;
    if (!card || !image?.data) {
      throw new NotFoundException({ error: 'Image not found' });
    }

    return {
      buffer: Buffer.from(image.data, 'base64'),
      mimeType: image.mimeType ?? 'image/jpeg',
    };
  }

  private normalizeImage(
    image?: CreateMenuCardDto['image'],
  ): MenuCardImage {
    if (!image?.data) {
      return {
        name: image?.name ?? 'background.jpg',
        mimeType: image?.mimeType ?? 'image/jpeg',
      };
    }
    return {
      name: image.name ?? 'image.jpg',
      mimeType: image.mimeType ?? 'image/jpeg',
      data: image.data,
    };
  }

  private mergeImage(
    current: MenuCardImage,
    incoming?: CreateMenuCardDto['image'],
  ): MenuCardImage {
    if (!incoming) return current;
    if (incoming.data) {
      return {
        name: incoming.name ?? current.name ?? 'image.jpg',
        mimeType: incoming.mimeType ?? current.mimeType ?? 'image/jpeg',
        data: incoming.data,
      };
    }
    return {
      ...current,
      name: incoming.name ?? current.name,
      mimeType: incoming.mimeType ?? current.mimeType,
    };
  }

  private buildProfilePayload(user: {name:string; surname:string; cards?: MenuCard[]}) {
    return {
      name:user.name,
      surname:user.surname,
      card:sanitizeMenuCards(user.cards ?? []),
    }
  }


  private notifyMenuChanged(user: {name:string; surname: string; cards?: MenuCard[]}) {
    this.events.emit(DOMAIN_EVENTS.MENU_CHANGED, this.buildProfilePayload(user));
  }
}
