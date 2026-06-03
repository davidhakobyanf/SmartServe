import type { MenuCard, MenuCardImage } from '@/types';
import type { OrderRecord } from '@/types/orders';

export function truncateTitle(title: string | undefined, max = 15): string {
  const text = title?.trim() || '—';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export function normalizeMenuCard(raw: Partial<MenuCard> | null | undefined): MenuCard {
  const item = raw ?? {};
  const image = item.image as MenuCardImage | undefined;

  return {
    id: String(item.id ?? ''),
    title: String(item.title ?? '—'),
    description: String(item.description ?? ''),
    price: Number(item.price) || 0,
    sauces: Array.isArray(item.sauces) ? item.sauces : [],
    active: item.active !== false,
    image: image && (image.name || image.hasData) ? image : { name: '' },
    count: Number(item.count) || 1,
    table: item.table,
  };
}

export function normalizeOrderRecord(raw: Partial<OrderRecord> | null | undefined): OrderRecord {
  const order = raw ?? {};
  const items = Array.isArray(order.items)
    ? order.items.map((item) => normalizeMenuCard(item))
    : [];

  return {
    _id: String(order._id ?? ''),
    table: order.table ?? '',
    allPrice: Number(order.allPrice) || 0,
    createdAt: order.createdAt ?? new Date().toISOString(),
    items,
  };
}
