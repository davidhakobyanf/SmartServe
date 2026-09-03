import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { DiningSession } from "./dining-session.entity";
import { Product } from "./product.entity";
import { SauceSnapshot } from "src/common/types/sauce-snapshot";

@Entity("basket_items")
@Check(`"quantity" > 0`)
export class BasketItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  sessionId!: string;

  @ManyToOne(() => DiningSession, (session) => session.basketItems, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "sessionId" })
  session!: DiningSession;

  @Index()
  @Column({ type: "uuid" })
  productId!: string;

  @ManyToOne(() => Product, (product) => product.basketItems, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "productId" })
  product!: Product;

  @Column({ type: "int", default: 1 })
  quantity!: number;

  @Column({ type: "jsonb", default: [] })
  sauces!: SauceSnapshot[];

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

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
