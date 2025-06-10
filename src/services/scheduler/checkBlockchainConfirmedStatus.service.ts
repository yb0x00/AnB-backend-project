import {AppDataSource} from "@/data-source";
import {Contract} from "@/entities/Contract";
import {Notification} from "@/entities/Notification";
import {NotificationType} from "@/enums/NotificationType";
import {getContractStatus} from "@/services/blockchain/getContractStatus";
import {BlockChainContractStatus} from "@/enums/BlockChainContractStatus";

export const checkConfirmedStatusAndNotify = async (contractId: number) => {
    const contractRepo = AppDataSource.getRepository(Contract);
    const notificationRepo = AppDataSource.getRepository(Notification);

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
    console.log(`[BlockchainCheck] Blockchain status: ${status}`);

    const balancePayment = contract.payments.find(p => p.payment_type === "잔금");
    if (!balancePayment) {
        console.warn("[BlockchainCheck] No 잔금 payment found");
        return;
    }

    const message = `매물번호 ${contract.property.property_id}의 모든 결제가 완료되어 블록체인에 성공적으로 반영되었습니다.`;

    const users = [
        contract.lessee?.user,
        contract.lessor,
        contract.agent?.user,
    ].filter(Boolean);

    for (const user of users) {
        await notificationRepo.delete({
            user: {id: user.id},
            contract: {contract_id: contract.contract_id},
            notification_type: NotificationType.CONTRACT_BALANCE_PAYMENT_REQUEST,
        });

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

    console.log(`[BlockchainCheck] 알림 전송 완료`);
};
