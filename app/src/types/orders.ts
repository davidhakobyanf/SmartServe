import type { MenuCard } from './index';
import type { OrderStatus } from './restaurant';

export interface OrderRecord {
  _id: string;
  items: MenuCard[];
  allPrice: number;
  table: string | number;
  createdAt?: string;
  status?: OrderStatus;
}
