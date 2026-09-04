import type { MenuCard } from '@/types';
import type { OrderRecord } from '@/types/orders';
import type {
  BasketItemRecord,
  ProductRecord,
  RelationalOrder,
} from '@/types/restaurant';
import { resolveLocalizedText } from '@/types/localization';

export function productToMenuCard(product: ProductRecord): MenuCard {
  return {
    id: product.id,
    categoryId: product.categoryId,
    categoryName: product.category
      ? resolveLocalizedText(
          product.category.nameTranslations,
          product.category.name,
        )
      : undefined,
    title: resolveLocalizedText(product.titleTranslations, product.title),
    titleTranslations: product.titleTranslations,
    description: resolveLocalizedText(
      product.descriptionTranslations,
      product.description,
    ),
    descriptionTranslations: product.descriptionTranslations,
    price: Number(product.price) || 0,
    sauces: Array.isArray(product.sauces)
      ? product.sauces.map((sauce) => ({
          ...sauce,
          name: resolveLocalizedText(sauce.nameTranslations, sauce.name),
          price: Number(sauce.price) || 0,
        }))
      : [],
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
    sauces: Array.isArray(item.sauces)
      ? item.sauces.map((sauce) => ({
          id: sauce.id,
          name: resolveLocalizedText(sauce.nameTranslations, sauce.name),
          nameTranslations: sauce.nameTranslations,
          price: Number(sauce.unitPrice) || 0,
        }))
      : [],
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
      title: resolveLocalizedText(
        item.product?.titleTranslations,
        item.titleSnapshot,
      ),
      description: resolveLocalizedText(
        item.product?.descriptionTranslations,
        item.descriptionSnapshot,
      ),
      price: Number(item.unitPrice) || 0,
      sauces: Array.isArray(item.sauces)
        ? item.sauces.map((sauce) => ({
            id: sauce.id,
            name: resolveLocalizedText(sauce.nameTranslations, sauce.name),
            nameTranslations: sauce.nameTranslations,
            price: Number(sauce.unitPrice) || 0,
          }))
        : [],
      active: true,
      image: { name: '', hasData: Boolean(item.productId) },
      count: Number(item.quantity) || 1,
    })),
  };
}

export function normalizeOrderRecord(
  raw: RelationalOrder,
): OrderRecord {
  return relationalOrderToOrderRecord(raw);
}
