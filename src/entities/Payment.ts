import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from "typeorm";
import {Contract} from "./Contract";

@Entity("payments")
export class Payment {
    @PrimaryGeneratedColumn()
    payment_id!: number;

    @Column({length: 20})
    payment_type!: string; // 예: 계약금, 중도금, 잔금

    @Column("bigint")
    payment_amount!: number;

    @Column({type: "date", nullable: true})
    payment_due_date!: Date;

    @Column({type: "date", nullable: true})
    payment_actual_date?: Date;

    @Column({length: 30})
    payment_method!: string; // 예: 카카오페이, 가상계좌 등

    @Column({nullable: true})
    pg_token?: string; // PG사 결제 인증 토큰

    @Column({length: 20, nullable: true})
    payment_status!: string; // 예: 완료, 실패, 대기

    @Column({length: 255, nullable: true})
    payment_hash!: string; // 결제 정보의 해시값

    @Column({length: 255, nullable: true})
    payment_blockchain_tx_hash!: string;

    @Column({length: 20, nullable: true})
    payment_blockchain_status!: string;

    @CreateDateColumn()
    payment_created_at!: Date;

    @Column({length: 500, nullable: true})
    payment_session_url?: string;

    // 계약과의 관계
    @ManyToOne(() => Contract, (contract) => contract.payments)
    contract!: Contract;
}
