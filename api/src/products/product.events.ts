export const PRODUCT_DOMAIN_EVENTS = {
  CHANGED: "products:changed",
} as const;

export type ProductChangedPayload = {
  action: "created" | "updated" | "deleted";
  productId: string;
};
