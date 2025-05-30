import {Request, Response} from "express";
import {getContractIdForAgent} from "@/services/contractCreation/get.controller";

export const getContract = async (req: Request, res: Response): Promise<void> => {
    try {
        // 👇 타입 단언으로 안정성 확보
        const userId = (req as any).user?.id;
        const propertyId = Number(req.query.property_id);

        if (!userId || !propertyId) {
            res.status(400).json({message: "userId와 property_id는 필수입니다."});
            return;
        }

        const result = await getContractIdForAgent(userId, propertyId);

        if (!result) {
            res.status(404).json({message: "계약을 찾을 수 없습니다."});
            return;
        }

        res.status(200).json(result);
    } catch (err) {
        console.error("[getContract] 서버 오류:", err);
        res.status(500).json({message: "서버 오류가 발생했습니다."});
    }
};
