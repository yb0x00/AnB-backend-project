import {Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./User";
import {Agency} from "./Agency";
import {Property} from "./Property";

@Entity("agents")
export class Agent {
    @PrimaryGeneratedColumn()
    id!: number; // 고유 ID를 위해 별도 PK 설정

    @Column({length: 30})
    agent_license_number!: string;

    @ManyToOne(() => User, (user) => user.agent_roles)
    @JoinColumn()
    user!: User;

    @ManyToOne(() => Agency, (agency) => agency.agents, {nullable: true})
    agency?: Agency;

    @OneToMany(() => Property, (property) => property.agent, {nullable: true})
    property?: Property;
}
