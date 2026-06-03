import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { OrderRecord } from '../common/types/menu-card';

@Entity('order_store')
export class OrderStore {
  @PrimaryColumn({ type: 'int', default: 1 })
  id!: number;

  @Column({ type: 'jsonb', default: [] })
  orders!: OrderRecord[];
}
