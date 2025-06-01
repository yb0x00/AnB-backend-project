import {
    Entity,
    Column,
    ManyToOne,
    Generated,
    Unique,
    PrimaryColumn, JoinColumn,
} from "typeorm";
import {PropertyStatus} from "@/enums/PropertyStatus";
import {Agent} from "@/entities/Agent";
import {Lessor} from "@/entities/Lessor";

@Entity("properties")
@Unique(["property_address_lot", "property_lease_space"])
export class Property {
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

    @ManyToOne(() => Agent, {nullable: false})
    @JoinColumn()
    agent!: Agent;

    @ManyToOne(() => Lessor, {nullable: false})
    @JoinColumn()
    lessor!: Lessor;
}
