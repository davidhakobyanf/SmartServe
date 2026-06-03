import type { MenuCard } from './index';

export interface OrderRecord {
  _id: string;
  items: MenuCard[];
  allPrice: number;
  table: string | number;
  createdAt?: string;
}
