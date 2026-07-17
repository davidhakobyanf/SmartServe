import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Permission } from '../common/auth/permission';


@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id!:string;
    

    //Waiter
    //Administrator
    //Manager
    @Column({ type:'varchar', length:100 })
    name!:string;
    

    //waiter
    //administrator
    //manager
    //owner 
    @Column({ 
      type: 'varchar',
      length:50,
      unique: true, // Unique code for the role, e.g., 'waiter', 'administrator', 'manager', 'owner'
    })
    code!: string;

    @Column({
        type:'jsonb',
        default:[],
    })
    permissions!: Permission[];
    
    //isSystem indicates whether the role is a system role. For example, the owner role cannot be deleted.
    @Column({
        type:'boolean',
        default:false,
    })
    isSystem!:boolean;

    @Column({
        type:'boolean',
        default:true,
    })
    isActive!:boolean;

    @CreateDateColumn()
    createdAt!:Date;

    @UpdateDateColumn()
    updatedAt!:Date;
}