import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
} from "typeorm";
import {Contract} from "./Contract";
import {User} from "./User";

@Entity("signatures")
export class Signature {
    @PrimaryGeneratedColumn()
    signature_id!: number;

    @Column({length: 512})
    signature_value!: string;   // 서명 주소

    @Column("text")
    signed_message!: string;  // 프론트에서 서명한 원본 메시지 저장

    @CreateDateColumn()
    signed_at!: Date;   // DB에 저장된 시간

    @ManyToOne(() => Contract, (contract) => contract.signatures)
    contract!: Contract;

    @ManyToOne(() => User)
    user!: User;
}
