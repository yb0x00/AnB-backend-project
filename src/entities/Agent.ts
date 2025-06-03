import {Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./User";
import {Agency} from "./Agency";
import {Property} from "@/entities/Property";

@Entity("agents")
export class Agent {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({length: 30})
    agent_license_number!: string;

    @ManyToOne(() => User, {nullable: false})
    @JoinColumn()
    user!: User;

    @ManyToOne(() => Agency, (agency) => agency.agents, {nullable: true})
    agency?: Agency;

    @OneToMany(() => Property, (property) => property.agent)
    properties!: Property[];
}
