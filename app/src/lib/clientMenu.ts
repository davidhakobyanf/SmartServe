import type { MenuCard } from '@/types';

export function getMenuLineTotal(item: MenuCard): number {
  const extras = (item.sauces ?? []).reduce((sum, sauce) => sum + sauce.price, 0);
  return (item.price + extras) * (item.count ?? 1);
}

export function getBasketLineKey(item: MenuCard): string {
  const sauceIds = (item.sauces ?? []).map((sauce) => sauce.id);
  return `${item.basketItemId ?? item.id}|${JSON.stringify(sauceIds)}`;
}
