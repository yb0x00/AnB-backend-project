import {AppDataSource} from "@/data-source";
import {ContractRequest} from "@/entities/ContractRequest";
import {ContractRequestStatus} from "@/enums/ContractRequest";
import {NotFoundError} from "@/errors/NotFoundError";
import {UnauthorizedError} from "@/errors/UnauthorizedError";
import {Notification} from "@/entities/Notification";
import {NotificationType} from "@/enums/NotificationType";
import leaseContract from "@/services/blockchain/leaseContract.service";
import {Contract} from "@/entities/Contract";
import {User} from "@/entities/User";

export const acceptContractRequestService = async (
    propertyId: number,
    userId: number,
    role: "lessor" | "agent"
) => {
    const contractRequestRepo = AppDataSource.getRepository(ContractRequest);
    const notificationRepo = AppDataSource.getRepository(Notification);
    const contractRepo = AppDataSource.getRepository(Contract);
    const userRepo = AppDataSource.getRepository(User);

    console.log(`[시작] 계약 요청 승인 - propertyId: ${propertyId}, userId: ${userId}, role: ${role}`);

    const contractRequest = await contractRequestRepo.findOne({
        where: {
            property: {property_id: propertyId},
            ...(role === "lessor" ? {lessor: {user: {id: userId}}} : {}),
            ...(role === "agent" ? {agent: {user: {id: userId}}} : {}),
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
        console.error(`[오류] 계약 요청을 찾을 수 없습니다.`);
        throw new NotFoundError("해당 계약 요청이 존재하지 않습니다.");
    }

    if (
        (role === "lessor" && contractRequest.lessor.user.id !== userId) ||
        (role === "agent" && contractRequest.agent.user.id !== userId)
    ) {
        console.error(`[오류] 승인 권한 없음`);
        throw new UnauthorizedError("해당 사용자에게 승인 권한이 없습니다.");
    }

    // 승인 처리
    if (role === "lessor") {
        contractRequest.lessorAccepted = true;
    } else {
        contractRequest.agentAccepted = true;
    }

    console.log(`[정보] 승인 처리 완료. lessorAccepted: ${contractRequest.lessorAccepted}, agentAccepted: ${contractRequest.agentAccepted}`);

    await notificationRepo.delete({
        user: {id: userId},
        notification_type: NotificationType.CONTRACT_REQUEST,
    });

    let blockchainContractId: number | null = null;
    let blockchainMessage = "";

    if (contractRequest.lessorAccepted && contractRequest.agentAccepted) {
        contractRequest.status = ContractRequestStatus.APPROVED;
        console.log(`[정보] 양측 승인 완료 → 블록체인 계약 여부 확인 중...`);

        const existingContractId = await leaseContract.getContractId(propertyId);
        const existingIdNum = Number(existingContractId);
        console.log(`[정보] 현재 블록체인 contractId: ${existingContractId}`);

        if (existingContractId === 0n) {
            console.log(`[정보] 기존 블록체인 계약 없음 → 새로 생성 시도`);

            const lesseeWallet = (await userRepo.findOneByOrFail({id: contractRequest.lessee.user.id})).wallet_address;
            const lessorWallet = (await userRepo.findOneByOrFail({id: contractRequest.lessor.user.id})).wallet_address;
            const agentWallet = (await userRepo.findOneByOrFail({id: contractRequest.agent.user.id})).wallet_address;

            console.log(`[지갑] lessee: ${lesseeWallet}, lessor: ${lessorWallet}, agent: ${agentWallet}`);

            if (!lesseeWallet || !lessorWallet || !agentWallet) {
                throw new Error("지갑 주소가 누락된 사용자가 있어 블록체인 계약을 생성할 수 없습니다.");
            }

            await leaseContract.createContract({
                propertyId,
                lesseeId: lesseeWallet,
                lessorId: lessorWallet,
                agentId: agentWallet,
            });

            console.log(`[블록체인] 계약 생성 요청 완료`);

            const contractIdFromChain = await leaseContract.getContractId(propertyId);
            blockchainContractId = Number(contractIdFromChain);
            blockchainMessage = "블록체인에 새 계약이 생성되었습니다.";
            console.log(`[블록체인] 새 contractId 조회: ${contractIdFromChain}`);
        } else {
            blockchainContractId = existingIdNum;
            blockchainMessage = "이미 블록체인에 계약이 존재합니다.";
            console.log(`[블록체인] 기존 계약 존재 - ID: ${existingIdNum}`);
        }

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
        console.log(`[DB] 새로운 계약 저장 완료 - contractId: ${savedContract.contract_id}`);

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

        console.log(`[알림] 계약 생성 알림 저장 완료`);
    }

    await contractRequestRepo.save(contractRequest);
    console.log(`[완료] contractRequest 상태 저장 완료`);

    return {
        message: "계약 요청이 성공적으로 승인되었습니다.",
        blockchainNotice: blockchainMessage,
        blockchainContractId,
        status: contractRequest.status,
    };
};

