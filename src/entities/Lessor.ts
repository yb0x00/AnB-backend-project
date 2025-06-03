import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity("lessors")
export class Lessor {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn()
    user!: User;
}
