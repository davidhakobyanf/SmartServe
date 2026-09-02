import type { MenuCard, MenuCardImage } from '@/types';
import type { OrderRecord } from '@/types/orders';
import type {
  BasketItemRecord,
  ProductRecord,
  RelationalOrder,
} from '@/types/restaurant';

export function truncateTitle(title: string | undefined, max = 15): string {
  const text = title?.trim() || '—';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export function productToMenuCard(product: ProductRecord): MenuCard {
  return {
    id: product.id,
    categoryId: product.categoryId,
    categoryName: product.category?.name,
    title: product.title,
    description: product.description,
    price: Number(product.price) || 0,
    sauces: Array.isArray(product.sauces) ? product.sauces : [],
    active: product.isActive,
    image: {
      name: product.imageName ?? '',
      mimeType: product.imageMimeType ?? undefined,
      hasData: Boolean(product.imageName),
    },
    count: 1,
  };
}

export function basketItemToMenuCard(item: BasketItemRecord): MenuCard {
  const card = productToMenuCard(item.product);
  return {
    ...card,
    basketItemId: item.id,
    price: Number(item.unitPrice) || 0,
    sauces: Array.isArray(item.sauces) ? item.sauces : [],
    count: Number(item.quantity) || 1,
  };
}

export function relationalOrderToOrderRecord(order: RelationalOrder): OrderRecord {
  return {
    _id: order.id,
    table: order.table?.number ?? '',
    allPrice: Number(order.total) || 0,
    createdAt: order.createdAt,
    status: order.status,
    items: (order.items ?? []).map((item) => ({
      id: item.productId ?? item.id,
      title: item.titleSnapshot,
      description: item.descriptionSnapshot,
      price: Number(item.unitPrice) || 0,
      sauces: Array.isArray(item.sauces) ? item.sauces : [],
      active: true,
      image: { name: '', hasData: Boolean(item.productId) },
      count: Number(item.quantity) || 1,
    })),
  };
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

export function normalizeOrderRecord(
  raw: Partial<OrderRecord> | RelationalOrder | null | undefined,
): OrderRecord {
  if (raw && 'total' in raw && 'status' in raw) {
    return relationalOrderToOrderRecord(raw as unknown as RelationalOrder);
  }
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
