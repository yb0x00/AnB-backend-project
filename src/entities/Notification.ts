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
import {NotificationType} from "../enums/NotificationType";

@Entity("notifications")
export class Notification {
    @PrimaryGeneratedColumn()
    notification_id!: number;

    @Column({
        type: "enum",
        enum: NotificationType,
    })
    notification_type!: NotificationType;

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
