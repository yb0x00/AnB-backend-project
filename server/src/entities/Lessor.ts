import {Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./User";
import {Property} from "./Property";

@Entity("lessors")
export class Lessor {
    @PrimaryGeneratedColumn()
    id!: number; // 고유 ID를 위해 별도 PK 설정

    @ManyToOne(() => User, (user) => user.lessor_roles)
    @JoinColumn()
    user!: User;

    @OneToMany(() => Property, (property) => property.lessor, {nullable: true})
    property?: Property[];
}
