import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
} from "typeorm";
import {Agent} from "./Agent";
import {AbstractEntity} from "./AbstractEntity";

@Entity("agencies")
export class Agency extends AbstractEntity {
    @PrimaryGeneratedColumn()
    agency_id!: number;

    @Column({length: 100})
    agency_name!: string;

    @Column({length: 20})
    agency_phone!: string;

    @OneToMany(() => Agent, (agent) => agent.agency)
    agents!: Agent[];
}
