import { Request, Response } from "express";
import { createSignatureService } from "@/services/signature.service";

export const createSignatureController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { contract_id, address, signature, message } = req.body;

        if (!userId || !contract_id || !address || !signature || !message) {
            res.status(400).json({ message: "필수 파라미터가 누락되었습니다." });
            return;
        }

        await createSignatureService({ userId, contractId: contract_id, address, signature, message });

        res.status(201).json({ message: "서명이 저장되었습니다." });
    } catch (err: any) {
        console.error("서명 생성 실패:", err);
        res.status(500).json({ message: "서명 처리 중 오류 발생" });
    }
};
