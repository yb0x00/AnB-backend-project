import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
} from "typeorm";
import {Property} from "./Property";
import {User} from "./User";
import {Agent} from "./Agent";
import {Signature} from "./Signature";
import {Payment} from "./Payment";
import {Lessee} from "./Lessee";

@Entity("contracts")
export class Contract {
    @PrimaryGeneratedColumn()
    contract_id!: number;

    @Column({length: 20})
    contract_status!: string;

    @CreateDateColumn()
    contract_created_at!: Date;

    @Column({type: "timestamp", nullable: true})
    contract_expired_at?: Date;

    @Column({length: 50, nullable: true})
    contract_termination_reason?: string;

    @Column({length: 255, nullable: true})
    contract_hash!: string;

    @Column({length: 42, nullable: true})
    contract_address!: string;

    @Column({length: 255, nullable: true})
    contract_blockchain_tx_hash!: string;

    @Column({length: 20})
    contract_blockchain_status!: string;

    // 관계
    @ManyToOne(() => Property)
    property!: Property;

    @ManyToOne(() => Lessee, (lessee) => lessee.contracts, {nullable: false})
    lessee!: Lessee;

    @ManyToOne(() => User)
    lessor!: User;

    @ManyToOne(() => Agent)
    agent!: Agent;

    @ManyToOne(() => Contract, {nullable: true})
    previous_contract?: Contract;

    @OneToMany(() => Signature, (signature) => signature.contract)
    signatures!: Signature[];

    @OneToMany(() => Payment, (payment) => payment.contract)
    payments!: Payment[];
}
