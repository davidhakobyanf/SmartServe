import { Entity, PrimaryGeneratedColumn, Index, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";


export type DiningSessionStatus = 'open' | 'closed';

@Entity('dining-sessions')
export class DiningSession {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column({ type: 'int' })
    tableNumber!:number;

    @Column({ type: 'varchar', default: 'open'})
    status!: DiningSessionStatus;

    @CreateDateColumn()
    createdAt!: Date;

    @Column({  type: 'timestamptz' , nullable:true})
    closedAt!: Date | null;
}