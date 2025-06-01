import { AppDataSource } from "@/data-source";
import { ContractRequest } from "@/entities/ContractRequest";
import { ContractRequestStatus } from "@/enums/ContractRequest";
import { NotFoundError } from "@/errors/NotFoundError";
import { UnauthorizedError } from "@/errors/UnauthorizedError";
import { Notification } from "@/entities/Notification";
import { NotificationType } from "@/enums/NotificationType";
import leaseContract from "@/services/blockchain/leaseContract.service";
import { Contract } from "@/entities/Contract";

export const acceptContractRequestService = async (
    propertyId: number,
    userId: number,
    role: "lessor" | "agent"
) => {
    const contractRequestRepo = AppDataSource.getRepository(ContractRequest);
    const notificationRepo = AppDataSource.getRepository(Notification);
    const contractRepo = AppDataSource.getRepository(Contract);

    const contractRequest = await contractRequestRepo.findOne({
        where: {
            property: { property_id: propertyId },
            ...(role === "lessor" ? { lessor: { user: { id: userId } } } : {}),
            ...(role === "agent" ? { agent: { user: { id: userId } } } : {}),
        },
        relations: [
            "property",
            "lessee",
            "lessee.user",
            "lessor",
            "lessor.user",
            "agent",
            "agent.user",
        ],
    });

    if (!contractRequest) {
        throw new NotFoundError("해당 계약 요청이 존재하지 않습니다.");
    }

    if (
        (role === "lessor" && contractRequest.lessor.user.id !== userId) ||
        (role === "agent" && contractRequest.agent.user.id !== userId)
    ) {
        throw new UnauthorizedError("해당 사용자에게 승인 권한이 없습니다.");
    }

    // 승인 처리
    if (role === "lessor") {
        contractRequest.lessorAccepted = true;
    } else if (role === "agent") {
        contractRequest.agentAccepted = true;
    }

    await notificationRepo.delete({
        user: { id: userId },
        notification_type: NotificationType.CONTRACT_REQUEST,
    });

    let blockchainContractId: number | null = null;
    let blockchainMessage = "";

    // 양측 모두 승인했을 때
    if (contractRequest.lessorAccepted && contractRequest.agentAccepted) {
        contractRequest.status = ContractRequestStatus.APPROVED;

        const existingContractId = await leaseContract.getContractId(propertyId);
        console.log("getContractId 반환값 =", existingContractId);

        const existingIdNum = Number(existingContractId);
        console.log("Number 변환된 contractId =", existingIdNum);

        if (existingIdNum === 0) {
            const txResult = await leaseContract.createContract(propertyId);
            blockchainContractId = Number(txResult.contractId);
            blockchainMessage = "블록체인에 새 계약이 생성되었습니다.";
        } else {
            blockchainContractId = existingIdNum;
            blockchainMessage = "이미 블록체인에 계약이 존재합니다.";
        }

        // DB에 새로운 계약 저장
        const newContract = contractRepo.create({
            contract_status: "PENDING",
            contract_blockchain_id: blockchainContractId,
            contract_blockchain_status: "SUBMITTED",
            property: contractRequest.property,
            lessee: contractRequest.lessee,
            lessor: contractRequest.lessor,
            agent: contractRequest.agent,
        });

        const savedContract = await contractRepo.save(newContract);

        const lesseeUser = contractRequest.lessee.user;
        const lessorUser = contractRequest.lessor.user;
        const agentUser = contractRequest.agent.user;

        const agentName = agentUser.user_name;
        const lessorName = lessorUser.user_name;

        await notificationRepo.save([
            notificationRepo.create({
                user: lesseeUser,
                notification_type: NotificationType.CONTRACT_CREATION_REQUEST,
                notification_message: `요청이 승인되었습니다. ${agentName} 중개사가 현재 계약서를 작성 중입니다.`,
                contract: savedContract,
            }),
            notificationRepo.create({
                user: lessorUser,
                notification_type: NotificationType.CONTRACT_CREATION_REQUEST,
                notification_message: `${agentName} 중개사가 현재 계약서를 작성 중입니다.`,
                contract: savedContract,
            }),
            notificationRepo.create({
                user: agentUser,
                notification_type: NotificationType.CONTRACT_CREATION_REQUEST,
                notification_message: `${lessorName} 임대인이 요청을 수락하였습니다. 계약서를 작성해주세요.`,
                contract: savedContract,
            }),
        ]);
    }

    await contractRequestRepo.save(contractRequest);

    return {
        message: "계약 요청이 성공적으로 승인되었습니다.",
        blockchainNotice: blockchainMessage,
        blockchainContractId: blockchainContractId,
        status: contractRequest.status,
    };
};
