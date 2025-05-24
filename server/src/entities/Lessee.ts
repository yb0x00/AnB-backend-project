import {Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./User";
import {Contract} from "./Contract";

@Entity("lessees")
export class Lessee {
    @PrimaryGeneratedColumn()
    id!: number; // 고유 ID를 위해 별도 PK 설정

    @ManyToOne(() => User, (user) => user.lessee_roles, {nullable: true})
    user!: User;

    @ManyToOne(() => Contract, (contract) => contract.lessee, {nullable: true})
    contract!: Contract;
}
