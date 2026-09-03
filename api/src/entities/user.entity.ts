import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Permission } from '../common/auth/permission';
import { UserStatus } from '../common/auth/user-status';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  surname!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  roleId!: string | null;
  
  @ManyToOne(() => Role, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'roleId'})
  role!: Role | null;

  @Column({
    type: 'enum',
    enum: UserStatus,
    enumName:'user_status_enum',
    default: UserStatus.PENDING,
  })
  status!: UserStatus;

  @Column({
    type: 'jsonb',
    default: [],
  })
  permissionAllow!: Permission[];

  @Column({
    type: 'jsonb',
    default: [],
  })
  permissionDeny!: Permission[];

  @Column({
    type: 'uuid',
    nullable:true,
  })
  approvedByUserId!: string | null;

  @ManyToOne(() => User, (user) => user.approvedUsers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'approvedByUserId' })
  approvedBy!: User | null;

  @OneToMany(() => User, (user) => user.approvedBy)
  approvedUsers!: User[];

  @Column({
    type: 'timestamptz',
    nullable:true,
  })
  approvedAt!: Date | null;

  @Column({
    type:'text',
    nullable:true,
  })
  rejectionReason!: string | null;

  @Column({
    type: 'timestamptz',
    nullable:true,
  })
  lastLoginAt!: Date | null;
  
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
