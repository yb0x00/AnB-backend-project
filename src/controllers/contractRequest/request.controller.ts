import {Request, Response} from "express";
import {User} from "@/entities/User";
import {Lessee} from "@/entities/Lessee"; // Lessee 엔티티 import
import {AppDataSource} from "@/data-source"; // 데이터베이스 연결
import {requestContractService} from "@/services/contractRequest/create.service";

interface AuthenticatedRequest extends Request {
    user?: User;
}

export const requestController = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const userId = req.user?.id;
    const {property_id} = req.body;

    if (!userId || !property_id) {
        return res.status(400).json({message: "user_id와 property_id는 필수입니다."});
    }

    try {
        // lessee 여부 검증
        const lesseeRepo = AppDataSource.getRepository(Lessee);
        const isLessee = await lesseeRepo.findOne({
            where: {user: {id: userId}},
            relations: ["user"],
        });

        if (!isLessee) {
            return res.status(403).json({message: "해당 사용자는 세입자가 아닙니다."});
        }

        // 실제 계약 요청 처리
        const result = await requestContractService(userId, property_id);
        return res.status(200).json(result);
    } catch (err) {
        console.error("계약 요청 실패:", err);
        return res.status(500).json({message: "서버 오류"});
    }
};
