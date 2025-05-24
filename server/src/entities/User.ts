import {
    Entity,
    Column,
    OneToMany,
} from "typeorm";
import {AbstractEntity} from "./AbstractEntity";
import {Lessee} from "./Lessee";
import {Lessor} from "./Lessor";
import {Agent} from "./Agent";

@Entity("users")
export class User extends AbstractEntity {
    @Column({length: 100})
    user_name!: string;

    @Column({length: 100, unique: true})
    login_id!: string;

    @Column({length: 255, unique: true})
    email!: string;

    @Column({length: 255})
    password!: string;

    @Column({type: "char", length: 42})
    wallet_address?: string;

    @Column({length: 20, nullable: true})
    phone?: string;

    @Column({length: 255, nullable: true})
    resident_registration_number!: string;

    // 관계 설정
    @OneToMany(() => Lessee, (lessee) => lessee.user)
    lessee_roles!: Lessee[];

    @OneToMany(() => Lessor, (lessor) => lessor.user)
    lessor_roles!: Lessor[];

    @OneToMany(() => Agent, (agent) => agent.user)
    agent_roles!: Agent[];
}
