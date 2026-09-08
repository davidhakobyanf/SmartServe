import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Order } from "./order.entity";
import { Product } from "./product.entity";
import { SauceSnapshot } from "src/common/types/sauce-snapshot";
import type { LocalizedText } from "../common/i18n/localized-text";

@Entity("order_items")
@Check(`"quantity" > 0`)
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.items, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "orderId" })
  order!: Order;

  @Index()
  @Column({ type: "uuid", nullable: true })
  productId!: string | null;

  @ManyToOne(() => Product, (product) => product.orderItems, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "productId" })
  product!: Product | null;

  @Column({ type: "varchar", length: 160 })
  titleSnapshot!: string;

  @Column({ type: "text", default: "" })
  descriptionSnapshot!: string;

  @Column({ type: "jsonb", default: {} })
  titleTranslationsSnapshot!: LocalizedText;

  @Column({ type: "jsonb", default: {} })
  descriptionTranslationsSnapshot!: LocalizedText;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  unitPrice!: number;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "jsonb", default: [] })
  sauces!: SauceSnapshot[];

  @Column({
    type: "numeric",
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  lineTotal!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
