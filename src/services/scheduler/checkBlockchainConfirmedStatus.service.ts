import {AppDataSource} from "@/data-source";
import {Contract} from "@/entities/Contract";
import {Notification} from "@/entities/Notification";
import {NotificationType} from "@/enums/NotificationType";
import {getContractStatus} from "@/services/blockchain/getContractStatus";
import {BlockChainContractStatus} from "@/enums/BlockChainContractStatus";

export const checkConfirmedStatusAndNotify = async (contractId: number) => {
    const contractRepo = AppDataSource.getRepository(Contract);
    const notificationRepo = AppDataSource.getRepository(Notification);

    const maxAttempts = 10;
    const delayMs = 5000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const contract = await contractRepo.findOne({
            where: {contract_id: contractId},
            relations: [
                "payments",
                "property",
                "lessee",
                "lessee.user",
                "lessor",
                "agent",
                "agent.user"
            ],
        });

        if (!contract || contract.contract_blockchain_id == null) {
            console.error(`[BlockchainCheck] Contract not found or missing blockchain ID`);
            return;
        }

        const status = await getContractStatus(contract.contract_blockchain_id);
        console.log(`[Attempt ${attempt}] Blockchain status: ${status}`);

        if (status === BlockChainContractStatus.Confirmed) {
            const balancePayment = contract.payments.find(p => p.payment_type === "잔금");
            if (!balancePayment) {
                console.error("[BlockchainCheck] No 잔금 payment found");
                return;
            }

            const message = `매물번호 ${contract.property.property_id}의 모든 결제가 완료되어 블록체인에 성공적으로 반영되었습니다.`;
            const users = [
                contract.lessee?.user,
                contract.lessor,
                contract.agent?.user,
            ].filter(Boolean); // null/undefined 제거

            for (const user of users) {
                // 기존 알림 삭제
                await notificationRepo.delete({
                    user,
                    contract,
                    notification_type: NotificationType.CONTRACT_BALANCE_PAYMENT_REQUEST,
                });

                // 새 알림 생성
                const notification = notificationRepo.create({
                    user,
                    contract,
                    payment: balancePayment,
                    notification_type: NotificationType.CONTRACT_BALANCE_PAYMENT_CONFIRMED,
                    notification_message: message,
                    is_read: false,
                });

                await notificationRepo.save(notification);
            }

            console.log(`[BlockchainCheck] Confirmed → 3명 알림 업데이트 완료`);
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    console.warn(`[BlockchainCheck] Timeout: 상태가 Confirmed로 변경되지 않음`);
};
