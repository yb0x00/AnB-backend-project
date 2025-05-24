import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from "typeorm";
import {Contract} from "./Contract";
import {User} from "./User";

@Entity("signatures")
export class Signature {
    @PrimaryGeneratedColumn()
    signature_id!: number;

    @Column({length: 512})
    signature_value!: string;

    @CreateDateColumn()
    signed_at!: Date;

    @ManyToOne(() => Contract, (contract) => contract.signatures)
    contract!: Contract;

    @ManyToOne(() => User)
    user!: User;
}
