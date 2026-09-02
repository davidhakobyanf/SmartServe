import {
  Entity,
  PrimaryGeneratedColumn,
  Index,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { DiningTable } from "./dining-table.entity";
import { BasketItem } from "./basket-item.entity";
import { Order } from "./order.entity";

export type DiningSessionStatus = "open" | "closed";

@Entity("dining_sessions")
@Index("uq_open_session_per_table", ["tableId"], {
  unique: true,
  where: `"status" = 'open'`,
})
export class DiningSession {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({
    type: "uuid",
  })
  tableId!: string;

  @ManyToOne(() => DiningTable, (table) => table.sessions, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({
    name: "tableId",
  })
  table!: DiningTable;

  @OneToMany(() => BasketItem, (item) => item.session)
  basketItems!: BasketItem[];

  @OneToMany(() => Order, (order) => order.session)
  orders!: Order[];

  @Column({ type: "varchar", default: "open" })
  status!: DiningSessionStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  closedAt!: Date | null;
}
