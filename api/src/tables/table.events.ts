export const TABLE_DOMAIN_EVENTS = {
  CHANGED: "tables:changed",
} as const;

export type TableChangedPayload = { tableId: string };
