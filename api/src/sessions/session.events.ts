export const SESSION_DOMAIN_EVENTS = {
  CLOSED: "session:closed",
  BASKET_CHANGED: "session:basket-changed",
} as const;

export type SessionClosedPayload = {
  sessionId: string;
  tableNumber: number;
};

export type SessionBasketPayload = {
  sessionId: string;
  items: unknown[];
};
