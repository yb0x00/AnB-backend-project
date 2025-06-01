import {
    Entity,
    Column,
    ManyToOne, Generated, Unique, PrimaryColumn,
} from "typeorm";
import {Lessor} from "./Lessor";
import {Agent} from "./Agent";
import {PropertyStatus} from "@/enums/PropertyStatus";

@Entity("properties")
@Unique(["property_address_lot", "property_lease_space"])
export class Property {
    // 자동으로 ID 증가시키며 부여
    // @PrimaryGeneratedColumn()
    // property_id!: number;

    // 임의 지정
    @PrimaryColumn()
    property_id!: number;

    @Column()
    @Generated("increment")
    property_number!: number;

    @Column({
        type: "enum",
        enum: PropertyStatus,
        default: PropertyStatus.AVAILABLE,
    })
    property_status!: PropertyStatus;

    @Column({length: 100})
    property_headline!: string;

    @Column({length: 255})
    property_address_lot!: string;

    @Column({length: 50})
    property_building_usage!: string;

    @Column({length: 100})
    property_lease_space!: string;

    @Column("float")
    contract_lease_area!: number;

    @Column({length: 20})
    property_lease_type!: string;

    @Column("bigint")
    property_deposit_price!: number;

    @Column("bigint")
    property_monthly_rent_price!: number;

    // 관계 설정
    @ManyToOne(() => Lessor, (lessor) => lessor.property, {nullable: true})
    lessor!: Lessor;

    @ManyToOne(() => Agent, (agent) => agent.property, {nullable: true})
    agent!: Agent;
}
