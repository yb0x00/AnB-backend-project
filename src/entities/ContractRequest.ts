import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from "typeorm";
import { Property } from "./Property";
import { Lessee } from "./Lessee";
import { Lessor } from "./Lessor";
import { Agent } from "./Agent";
import { ContractRequestStatus } from "@/enums/ContractRequest";

@Entity("contract_requests")
export class ContractRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Property, { nullable: false })
    property!: Property;

    @ManyToOne(() => Lessee, { nullable: false })
    lessee!: Lessee;

    @ManyToOne(() => Lessor, { nullable: false })
    lessor!: Lessor;

    @ManyToOne(() => Agent, { nullable: false })
    agent!: Agent;

    @Column({
        type: "enum",
        enum: ContractRequestStatus,
        default: ContractRequestStatus.PENDING,
    })
    status!: ContractRequestStatus;

    @Column({ default: false })
    lessorAccepted!: boolean;

    @Column({ default: false })
    agentAccepted!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}
