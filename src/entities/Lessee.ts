import {Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./User";
import {Contract} from "./Contract";

@Entity("lessees")
export class Lessee {
    @PrimaryGeneratedColumn()
    id!: number; // 고유 ID를 위해 별도 PK 설정

    @ManyToOne(() => User, {nullable: false})
    user!: User;

    @OneToMany(() => Contract, (contract) => contract.lessee)
    contracts!: Contract[];
}
