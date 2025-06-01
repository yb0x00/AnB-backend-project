import {Request, Response} from "express";
import {acceptContractRequestService} from "@/services/contractRequest/accept.service";

// 인증된 사용자 타입 확장 (권장: 글로벌 타입 선언을 따로 분리해도 됩니다)
interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        role: "lessor" | "agent";
    };
}

export const acceptContractRequestController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const userId = req.user?.id;
    const role = req.user?.role;
    const {contractRequestId} = req.body;

    if (!userId || !contractRequestId || !role) {
        return res.status(400).json({message: "userId, contractRequestId, role 모두 필요합니다."});
    }

    try {
        const result = await acceptContractRequestService(contractRequestId, userId, role);
        return res.status(200).json(result);
    } catch (error) {
        console.error("계약 요청 승인 중 오류:", error);
        return res.status(500).json({message: "서버 오류"});
    }
};
