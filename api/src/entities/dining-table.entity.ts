import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { DiningSession } from "./dining-session.entity";

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
}
