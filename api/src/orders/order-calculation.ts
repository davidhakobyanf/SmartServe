import type { SauceSnapshot } from "../common/types/sauce-snapshot";

interface OrderableBasketItem {
  productId: string;
  product: { title: string; description: string };
  unitPrice: number;
  quantity: number;
  sauces: SauceSnapshot[];
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function createOrderItemSnapshot(item: OrderableBasketItem) {
  return {
    productId: item.productId,
    product: item.product,
    titleSnapshot: item.product.title,
    descriptionSnapshot: item.product.description,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    sauces: item.sauces,
    lineTotal: roundMoney(
      (item.unitPrice + item.sauces.reduce((sum, sauce) => sum + sauce.unitPrice, 0)) * item.quantity,
    ),
  };
}

export function calculateOrderTotal(items: Array<{ lineTotal: number }>): number {
  return roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
}
