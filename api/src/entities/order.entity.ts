import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { DiningSession } from "./dining-session.entity";
import { DiningTable } from "./dining-table.entity";
import { OrderItem } from "./order-item.entity";

export const ORDER_STATUSES = ["placed", "preparing", "ready", "completed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  tableId!: string;

  @ManyToOne(() => DiningTable, (table) => table.orders, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "tableId" })
  table!: DiningTable;

  @Index()
  @Column({ type: "uuid" })
  sessionId!: string;

  @ManyToOne(() => DiningSession, (session) => session.orders, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "sessionId" })
  session!: DiningSession;

  @Column({
    type: "enum",
    enum: ORDER_STATUSES,
    enumName: "order_status_enum",
    default: "placed",
  })
  status!: OrderStatus;

  @Column({
    type: "numeric",
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  total!: number;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items!: OrderItem[];

  @Column({ type: "timestamptz", nullable: true })
  completedAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
