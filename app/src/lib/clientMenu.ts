import type { MenuCard } from '@/types';

export type MenuBadge = 'popular' | 'chef' | null;

export function getMenuBadge(index: number): MenuBadge {
  if (index % 4 === 0) return 'popular';
  if (index % 4 === 1) return 'chef';
  return null;
}

export function getMenuLineTotal(item: MenuCard): number {
  const extras = (item.sauces ?? []).reduce((sum, sauce) => sum + sauce.price, 0);
  return (item.price + extras) * (item.count ?? 1);
}

export function getBasketLineKey(item: MenuCard): string {
  const sauceIds = (item.sauces ?? []).map((sauce) => sauce.id);
  return `${item.basketItemId ?? item.id}|${JSON.stringify(sauceIds)}`;
}
