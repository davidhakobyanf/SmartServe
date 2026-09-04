import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { DiningSession } from "./dining-session.entity";
import { Order } from "./order.entity";
import type { LocalizedText } from "../common/i18n/localized-text";

@Entity("tables")
export class DiningTable {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "int",
    unique: true,
  })
  number!: number;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
  })
  name!: string | null;

  @Column({ type: "jsonb", default: {} })
  nameTranslations!: LocalizedText;

  @Column({
    type: "uuid",
    unique: true,
  })
  publicToken!: string;

  @Column({
    type: "boolean",
    default: true,
  })
  isActive!: boolean;

  @CreateDateColumn({
    type: "timestamptz",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: "timestamptz",
  })
  updatedAt!: Date;

  @OneToMany(() => DiningSession, (session) => session.table)
  sessions!: DiningSession[];

  @OneToMany(() => Order, (order) => order.table)
  orders!: Order[];
}
