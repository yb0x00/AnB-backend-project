import {AppDataSource} from "@/data-source";
import {ContractRequest} from "@/entities/ContractRequest";
import {ContractRequestStatus} from "@/enums/ContractRequest";
import {NotFoundError} from "@/errors/NotFoundError";
import {UnauthorizedError} from "@/errors/UnauthorizedError";

export const acceptContractRequestService = async (
    contractRequestId: number,
    userId: number,
    role: "lessor" | "agent"
) => {
    const contractRequestRepo = AppDataSource.getRepository(ContractRequest);

    const contractRequest = await contractRequestRepo.findOne({
        where: {id: contractRequestId},
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

    // 권한 확인
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

    // 양쪽 모두 승인한 경우 상태 변경
    if (contractRequest.lessorAccepted && contractRequest.agentAccepted) {
        contractRequest.status = ContractRequestStatus.APPROVED;
    }

    await contractRequestRepo.save(contractRequest);

    // 지갑 주소 추출 (User 엔티티에서)
    const lesseeWallet = contractRequest.lessee.user.wallet_address;
    const lessorWallet = contractRequest.lessor.user.wallet_address;
    const agentWallet = contractRequest.agent.user.wallet_address;

    return {
        message: "계약 요청이 성공적으로 승인되었습니다.",
        contractRequestId: contractRequest.id,
        status: contractRequest.status,
        wallets: {
            lessee: lesseeWallet,
            lessor: lessorWallet,
            agent: agentWallet,
        },
    };
};
