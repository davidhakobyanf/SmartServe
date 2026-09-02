export const SESSION_DOMAIN_EVENTS = {
  CLOSED: "session:closed",
} as const;

export type SessionClosedPayload = {
  sessionId: string;
  tableNumber: number;
};
