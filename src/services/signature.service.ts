import {AppDataSource} from "@/data-source";
import {Contract} from "@/entities/Contract";
import {Signature} from "@/entities/Signature";
import {Lessor} from "@/entities/Lessor";
import {Lessee} from "@/entities/Lessee";
import {Agent} from "@/entities/Agent";
import {User} from "@/entities/User";
import {Notification} from "@/entities/Notification";
import {verifyMessage} from "ethers";
import {handlePostSignatureProcess} from "@/services/contractCreation/posetSignature.service";
import {NotificationType} from "@/enums/NotificationType";


interface CreateSignatureParams {
    userId: number;
    contractId: number;
    address: string; // 현재는 사용하지 않지만 받아두기만 함
    signature: string;
    message: string;
}

export const createSignatureService = async ({
                                                 userId,
                                                 contractId,
                                                 signature,
                                                 message,
                                             }: CreateSignatureParams) => {
    await AppDataSource.transaction(async (manager) => {
        const contractRepo = manager.getRepository(Contract);
        const signatureRepo = manager.getRepository(Signature);
        const userRepo = manager.getRepository(User);
        const lesseeRepo = manager.getRepository(Lessee);
        const lessorRepo = manager.getRepository(Lessor);
        const agentRepo = manager.getRepository(Agent);
        const notificationRepo = manager.getRepository(Notification);


        const contract = await contractRepo.findOne({
            where: {contract_id: contractId},
        });

        if (!contract) throw new Error("해당 계약이 존재하지 않습니다.");

        const validUserIds: number[] = [];

        const lessee = await lesseeRepo.findOne({where: {id: contract.lessee.id}, relations: ["user"]});
        const lessor = await lessorRepo.findOne({where: {id: contract.lessor.id}, relations: ["user"]});
        const agent = await agentRepo.findOne({where: {id: contract.agent.id}, relations: ["user"]});

        if (lessee?.user?.id) validUserIds.push(lessee.user.id);
        if (lessor?.user?.id) validUserIds.push(lessor.user.id);
        if (agent?.user?.id) validUserIds.push(agent.user.id);

        if (!validUserIds.includes(userId)) {
            throw new Error("계약의 당사자가 아닙니다.");
        }

        const user = await userRepo.findOneByOrFail({id: userId});

        // 서명 유효성 검증
        const recovered = verifyMessage(message, signature);
        if (recovered.toLowerCase() !== user.wallet_address!.toLowerCase()) {
            throw new Error("서명자 지갑 주소가 일치하지 않습니다.");
        }

        // 중복 서명 방지
        const existing = await signatureRepo.findOne({
            where: {
                user: {id: userId},
                contract: {contract_id: contractId},
            },
        });

        if (existing) {
            throw new Error("이미 서명한 사용자입니다.");
        }

        // 서명 저장
        const newSignature = signatureRepo.create({
            signature_value: signature,
            signed_message: message,
            user,
            contract,
        });

        await signatureRepo.save(newSignature);

        // 서명 요청 알림 삭제
        await notificationRepo.delete({
            user: {id: userId},
            contract: {contract_id: contractId},
            notification_type: NotificationType.CONTRACT_CREATION_READY
        });

        // 서명 수 확인
        const count = await signatureRepo.count({
            where: {contract: {contract_id: contractId}},
        });

        // 3명 서명 완료 시 후속 처리 실행 (트랜잭션 바깥에서 안전하게 실행)
        if (count === 3) {
            setImmediate(() => {
                handlePostSignatureProcess(contractId).catch(console.error);
            });
        }
    });
};
