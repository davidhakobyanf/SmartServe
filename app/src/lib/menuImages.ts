import { API_URL } from '@/lib/apiUrl';
import type { MenuCard, MenuImage } from '@/types';

export function menuImageApiUrl(cardId: string): string {
  return `${API_URL}/api/product-images/${cardId}`;
}

export function resolveMenuImageSrc(card: MenuCard): string {
  if (card.image?.hasData && card.id) {
    const version = card.updatedAt
      ? `?v=${encodeURIComponent(card.updatedAt)}`
      : '';
    return `${menuImageApiUrl(card.id)}${version}`;
  }
  const name = card.image?.name;
  if (name) {
    return `/images/${name}`;
  }
  return '/images/background.jpg';
}

export function loadMenuImages(cards: MenuCard[]): MenuImage[] {
  if (!cards?.length) return [];
  return cards.map((item) => ({
    id: item.id,
    src: resolveMenuImageSrc(item),
  }));
}
