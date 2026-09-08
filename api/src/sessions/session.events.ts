export const SESSION_DOMAIN_EVENTS = {
  OPENED: "session:opened",
  CLOSED: "session:closed",
  BASKET_CHANGED: "session:basket-changed",
} as const;

export type SessionOpenedPayload = {
  sessionId: string;
  tableNumber: number;
};

export type SessionClosedPayload = {
  sessionId: string;
  tableNumber: number;
};

export type SessionBasketPayload = {
  sessionId: string;
  items: unknown[];
};
