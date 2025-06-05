import {Request, Response} from "express";
import {getPaymentSessionUrlService} from "@/services/payment/stripe/paymentDwon.service";

export const getPaymentSessionUrlController = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
        res.status(401).json({message: "로그인이 필요합니다."});
        return;
    }

    const contractId = Number(req.query.contractId);
    const paymentType = String(req.query.paymentType);

    if (!contractId || !paymentType) {
        res.status(400).json({message: "필수 파라미터(contractId, paymentType)가 누락되었습니다."});
        return;
    }

    try {
        const sessionUrl = await getPaymentSessionUrlService({userId, contractId, paymentType});
        res.status(200).json({paymentSessionUrl: sessionUrl});
    } catch (error: any) {
        res.status(error.status || 500).json({message: error.message || "서버 오류"});
    }
};
