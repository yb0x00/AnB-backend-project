import { Request, Response } from "express";
import { createTestPaymentSession } from "@/services/test/paymentTest.service";

interface PaymentTestBody {
    contractId: number;
    paymentType: string;
}

export const handleTestPayment = async (
    req: Request<{}, any, PaymentTestBody>,
    res: Response
): Promise<void> => {
    const { contractId, paymentType } = req.body;

    if (!contractId || !paymentType) {
        res.status(400).json({ message: "contractId와 paymentType은 필수입니다." });
        return;
    }

    try {
        const session = await createTestPaymentSession(contractId, paymentType);
        res.status(200).json({ url: session.url });
    } catch (error) {
        console.error("Stripe 세션 생성 실패:", error);
        res.status(500).json({ message: "Stripe 세션 생성 실패" });
    }
};
