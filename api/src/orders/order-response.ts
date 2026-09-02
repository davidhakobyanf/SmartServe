import { Order } from "src/entities/order.entity";

export function hideOrderFinancials(order: Order) {
  return {
    ...order,
    total: null,
    items: (order.items ?? []).map((item) => ({
      ...item,
      unitPrice: null,
      lineTotal: null,
      product: undefined,
    })),
  };
}

export function hideOrdersFinancials(orders: Order[]) {
  return orders.map(hideOrderFinancials);
}
