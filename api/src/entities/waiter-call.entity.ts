import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { DiningSession } from "./dining-session.entity";

@Entity("waiter_calls")
@Index("uq_pending_waiter_call_per_session", ["sessionId"], {
  unique: true,
  where: '"resolvedAt" IS NULL',
})
export class WaiterCall {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  sessionId!: string;

  @ManyToOne(() => DiningSession, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "sessionId" })
  session!: DiningSession;

  @Column({ type: "integer" })
  tableNumber!: number;

  @CreateDateColumn({ type: "timestamptz" })
  calledAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  resolvedAt!: Date | null;
}
