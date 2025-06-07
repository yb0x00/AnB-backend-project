import {AppDataSource} from "@/data-source";
import {Contract} from "@/entities/Contract";
import {ContractDetail} from "@/entities/ContractDetail";
import {Notification} from "@/entities/Notification";
import {NotificationType} from "@/enums/NotificationType";
import {createHash} from "crypto";
import {shareContract} from "@/services/blockchain/shareContract";
import {Lessor} from "@/entities/Lessor";

export const createContractDetailService = async (
    contractId: number,
    agentUserId: number,
    detailData: Partial<ContractDetail>
) => {
    const contractRepo = AppDataSource.getRepository(Contract);
    const detailRepo = AppDataSource.getRepository(ContractDetail);
    const notificationRepo = AppDataSource.getRepository(Notification);
    const lessorRepo = AppDataSource.getRepository(Lessor);

    console.log("contractId param:", contractId);
    console.log("agentUserId param:", agentUserId);

    const contract = await contractRepo.findOne({
        where: {contract_id: contractId},
        relations: [
            "agent",
            "agent.user",
            "lessee",
            "lessee.user",
            "lessor",
            "lessor.user",
            "property"
        ]
    });


    console.log("Fetched contract:", contract);

    if (!contract) throw {status: 404, message: "Contract not found"};
    if (contract.agent.user.id !== agentUserId) {
        console.log("Unauthorized access by user:", agentUserId);
        throw {status: 403, message: "Unauthorized"};
    }

    try {
        // 1. 계약서 세부 정보 저장
        const contractDetail = detailRepo.create({
            ...detailData,
            contract
        });
        console.log("ContractDetail to save (with contract FK):", contractDetail);
        await detailRepo.save(contractDetail);

        // 2. 해시 생성
        const contractDetailJson = JSON.stringify(contractDetail);
        const contractHash = createHash("sha256").update(contractDetailJson).digest("hex");
        console.log("Generated contract hash:", contractHash);

        // 3. 블록체인 공유
        if (!contract.contract_blockchain_id) {
            throw {status: 400, message: "블록체인 ID가 설정되지 않았습니다."};
        }

        await shareContract(
            contract.contract_blockchain_id,
            contractHash,
            Math.floor(new Date(contractDetail.contract_lease_start_date).getTime() / 1000),
            Math.floor(new Date(contractDetail.contract_lease_end_date).getTime() / 1000)
        );

        // 4. 해시 저장
        contract.contract_hash = contractHash;
        await contractRepo.save(contract);

        // 5. 기존 알림 삭제
        await notificationRepo.delete({
            contract: {contract_id: contractId},
            notification_type: NotificationType.CONTRACT_CREATION_REQUEST
        });

        // 6. 알림 전송
        const propertyNumber = contract.property.property_number;

        const messageForLessorLessee = `***${propertyNumber}번 매물에 대한 계약서 작성이 완료되었습니다. 확인 후 서명해 주세요.`;
        const messageForAgent = `***${propertyNumber}번 매물 계약서가 성공적으로 저장되었습니다. 본인 서명을 완료해 주세요.`;

        // Lessor user 조회
        const lessor = await lessorRepo.findOne({
            where: {id: contract.lessor.id},
            relations: ["user"]
        });
        if (!lessor) throw new Error("lessor not found");

        // 알림 대상 + 메시지 구성
        const usersWithMessages = [
            {user: lessor.user, message: messageForLessorLessee},
            {user: contract.lessee.user, message: messageForLessorLessee},
            {user: contract.agent.user, message: messageForAgent}
        ];

        for (const {user, message} of usersWithMessages) {
            const newNotification = notificationRepo.create({
                user,
                contract,
                notification_type: NotificationType.CONTRACT_CREATION_READY,
                notification_message: message
            });
            await notificationRepo.save(newNotification);
        }

        return {message: "Contract detail created and shared successfully."};
    } catch (error) {
        console.error("계약서 작성 중 오류 발생:", error);
        throw {
            status: 500,
            message: "계약서 작성 중 오류가 발생했습니다. 다시 시도해 주세요."
        };
    }
};

