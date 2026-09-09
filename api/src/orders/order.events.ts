export const ORDER_DOMAIN_EVENTS = {
  CHANGED: "orders:changed",
} as const;

export interface OrderChangePayload {
  order: import('../entities/order.entity').Order;
  action: 'created' | 'updated';
}
