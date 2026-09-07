import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Category } from "./category.entity";
import { BasketItem } from "./basket-item.entity";
import { OrderItem } from "./order-item.entity";
import { ProductSauce } from "./product-sauce.entity";
import type { LocalizedText } from "../common/i18n/localized-text";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  categoryId!: string;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "categoryId" })
  category!: Category;

  @Column({ type: "varchar", length: 160 })
  title!: string;

  @Column({ type: "jsonb", default: {} })
  titleTranslations!: LocalizedText;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "jsonb", default: {} })
  descriptionTranslations!: LocalizedText;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  price!: number;

  @Column({ type: "integer", nullable: true })
  stockQuantity!: number | null;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  imageName!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  imageMimeType!: string | null;

  @Column({ type: "bytea", nullable: true, select: false })
  imageData!: Buffer | null;

  @OneToMany(() => BasketItem, (item) => item.product)
  basketItems!: BasketItem[];

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems!: OrderItem[];

  @OneToMany(() => ProductSauce, (productSauce) => productSauce.product)
  sauceLinks!: ProductSauce[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
