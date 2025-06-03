import { Request, Response } from "express";
import {createContractDetailService} from "@/services/contractCreation/writeDetail.service";

export const createContractDetailController = async (req: Request, res: Response) => {
    const contractId = Number(req.params.contractId);
    const agentUserId = req.user?.id; // 토큰에서 user 정보 추출
    const detailData = req.body;

    if (!contractId || !agentUserId) {
        res.status(400).json({ message: "잘못된 요청입니다." });
        return;
    }

    try {
        const result = await createContractDetailService(contractId, agentUserId, detailData);
        res.status(201).json(result);
    } catch (error: any) {
        console.error("Error in createContractDetailController:", error);
        res.status(error.status || 500).json({ message: error.message || "서버 오류" });
    }
};
