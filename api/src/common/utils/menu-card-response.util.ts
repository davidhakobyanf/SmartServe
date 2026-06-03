import type { MenuCard, MenuCardImage } from '../types/menu-card';

/** Do not send base64 in JSON — frontend loads via /api/menu-images/:cardId */
export function sanitizeMenuCard(card: MenuCard): MenuCard {
  const image = card.image as MenuCardImage;
  const hasData = Boolean(image?.data);

  return {
    ...card,
    image: {
      name: image?.name ?? 'image.jpg',
      mimeType: image?.mimeType ?? 'image/jpeg',
      hasData,
    },
  };
}

export function sanitizeMenuCards(cards: MenuCard[] = []): MenuCard[] {
  return cards.map(sanitizeMenuCard);
}
