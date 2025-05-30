import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from "typeorm";
import {Property} from "./Property";
import {Lessee} from "./Lessee";
import {ContractRequestStatus} from "@/enums/ContractRequest";
import {User} from "@/entities/User";
import {Agent} from "@/entities/Agent";

@Entity("contract_requests")
export class ContractRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Property, {nullable: false})
    property!: Property;

    @ManyToOne(() => Lessee, {nullable: false})
    lessee!: Lessee;

    @ManyToOne(() => User, {nullable: false})
    lessor!: User;

    @ManyToOne(() => Agent, {nullable: false})
    agent!: Agent;


    @Column({
        type: "enum",
        enum: ContractRequestStatus,
        default: ContractRequestStatus.PENDING,
    })
    status!: ContractRequestStatus;

    @Column({default: false})
    lessorAccepted!: boolean;

    @Column({default: false})
    agentAccepted!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}

