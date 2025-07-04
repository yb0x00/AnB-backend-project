import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
} from "typeorm";
import {Contract} from "./Contract";

@Entity("contracts_details")
export class ContractDetail {
    @PrimaryGeneratedColumn()
    id!: number; // 고유 ID

    @OneToOne(() => Contract)
    @JoinColumn({name: "contract_id"}) // FK 명시
    contract!: Contract;

    @Column({length: 255})
    contract_property_location!: string;

    @Column({length: 50})
    contract_land_category!: string;

    @Column("float")
    contract_land_area!: number;

    @Column({length: 100})
    contract_building_structure!: string;

    @Column({length: 50})
    contract_building_usage!: string;

    @Column("float")
    contract_building_area!: number;

    @Column({length: 100})
    contract_lease_space!: string;

    @Column("float")
    contract_lease_area!: number;

    @Column("bigint")
    contract_deposit_amount!: number;

    @Column({length: 255})
    contract_deposit_korean!: string;

    @Column("bigint")
    contract_down_payment!: number;

    @Column("bigint")
    contract_intermediate_payment!: number;

    @Column({type: "date"})
    contract_intermediate_payment_date!: Date;

    @Column("bigint")
    contract_balance_payment!: number;

    @Column({type: "date"})
    contract_balance_payment_date!: Date;

    @Column("bigint")
    contract_monthly_rent!: number;

    @Column({type: "int"})
    contract_rent_payment_day!: number;

    @Column({type: "date"})
    contract_lease_start_date!: Date;

    @Column({type: "date"})
    contract_lease_end_date!: Date;

    @Column({type: "int"})
    contract_duration_months!: number;

    @Column({type: "text", nullable: true})
    special_terms?: string;

    @Column({type: "date"})
    contract_written_at!: Date;
}
