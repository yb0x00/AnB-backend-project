import {Request, Response} from "express";
import {User} from "@/entities/User";
import {acceptContractRequestService} from "@/services/contractRequest/accept.service";

interface AuthenticatedRequest extends Request {
    user?: User;
}

export const acceptContractRequestController = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const {property_id} = req.body;

    if (!userId || !property_id) {
        return res.status(400).json({message: "user_id와 property_id는 필수입니다."});
    }

    try {
        const result = await acceptContractRequestService(userId, property_id);
        return res.status(200).json(result);
    } catch (err) {
        console.error("계약 요청 승인 실패:", err);
        return res.status(500).json({message: "서버 오류"});
    }
};