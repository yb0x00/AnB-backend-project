import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
} from "typeorm";
import {Contract} from "./Contract";
import {Payment} from "./Payment";
import {User} from "./User";

@Entity("notifications")
export class Notification {
    @PrimaryGeneratedColumn()
    notification_id!: number;

    @Column({length: 50})
    notification_type!: string; // 예: '결제완료', '계약종료', 등

    @Column({length: 255})
    notification_message!: string;

    @Column({default: false})
    is_read!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @ManyToOne(() => Contract, {nullable: true})
    contract?: Contract;

    @ManyToOne(() => Payment, {nullable: true})
    payment?: Payment;

    @ManyToOne(() => User)
    user!: User;
}
