import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("venue_settings")
export class VenueSettings {
  @PrimaryColumn({ type: "smallint" })
  id!: number;

  @Column({ type: "varchar", length: 160, default: "SmartServe" })
  venueName!: string;

  @Column({ type: "varchar", length: 3, default: "AMD" })
  currency!: string;

  @Column({ type: "varchar", length: 100, default: "Asia/Yerevan" })
  timezone!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
