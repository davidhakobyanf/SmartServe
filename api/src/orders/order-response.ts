import { Order } from "src/entities/order.entity";

export function orderResponse(order: Order, includeFinancials: boolean) {
  return {
    id: order.id,
    tableId: order.tableId,
    table: order.table
      ? {
          id: order.table.id,
          number: order.table.number,
          name: order.table.name,
        }
      : undefined,
    sessionId: order.sessionId,
    status: order.status,
    total: includeFinancials ? order.total : null,
    completedAt: order.completedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: (order.items ?? []).map((item) => ({
      id: item.id,
      productId: item.productId,
      titleSnapshot: item.titleSnapshot,
      descriptionSnapshot: item.descriptionSnapshot,
      unitPrice: includeFinancials ? item.unitPrice : null,
      quantity: item.quantity,
      sauces: item.sauces,
      lineTotal: includeFinancials ? item.lineTotal : null,
      createdAt: item.createdAt,
    })),
  };
}

export function ordersResponse(orders: Order[], includeFinancials: boolean) {
  return orders.map((order) => orderResponse(order, includeFinancials));
}
