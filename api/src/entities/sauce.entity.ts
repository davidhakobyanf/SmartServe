import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ProductSauce } from "./product-sauce.entity";
import type { LocalizedText } from "../common/i18n/localized-text";

@Entity("sauces")
export class Sauce {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "varchar",
    length: 100,
    unique: true,
  })
  name!: string;

  @Column({ type: "jsonb", default: {} })
  nameTranslations!: LocalizedText;

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

  @Column({
    type: "boolean",
    default: true,
  })
  isActive!: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  imageName!: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  imageMimeType!: string | null;

  @Column({ type: "bytea", nullable: true, select: false })
  imageData!: Buffer | null;

  @OneToMany(() => ProductSauce, (productSauce) => productSauce.sauce)
  productLinks!: ProductSauce[];

  @CreateDateColumn({
    type: "timestamptz",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamptz",
  })
  updatedAt!: Date;
}
