import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { BasketTables } from '../common/types/menu-card';

@Entity('basket_store')
export class BasketStore {
  @PrimaryColumn({ type: 'int', default: 1 })
  id!: number;

  @Column({ type: 'jsonb', default: {} })
  tables!: BasketTables;
}
