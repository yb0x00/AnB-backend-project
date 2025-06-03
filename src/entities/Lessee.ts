import { Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Contract } from "./Contract";

@Entity("lessees")
export class Lessee {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn()
    user!: User;

    @OneToMany(() => Contract, (contract) => contract.lessee)
    contracts!: Contract[];
}
