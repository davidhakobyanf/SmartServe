import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Last logged-in user (same behaviour as Mongo `profile` collection). */
@Entity('session_profile')
export class SessionProfile {
  @PrimaryColumn({ type: 'int', default: 1 })
  id!: number;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;
}
