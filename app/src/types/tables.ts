export type DiningSessionStatus = 'open' | 'closed';

export interface SessionTable {
  id: string;
  number: number;
  name: string | null;
  nameTranslations: LocalizedText;
}

export interface DiningSession {
  id: string;
  status: DiningSessionStatus;
  createdAt: string;
  closedAt: string | null;
  table: SessionTable;
}

export interface RestaurantTable extends SessionTable {
  publicToken?: string;
  isActive: boolean;
  activeSession: DiningSession | null;
  createdAt: string;
  updatedAt: string;
}

export interface TablePayload {
  number: number;
  name?: string;
  nameTranslations?: LocalizedText;
  isActive?: boolean;
}
import type { LocalizedText } from './localization';
