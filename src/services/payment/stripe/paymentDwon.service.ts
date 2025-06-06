import {AppDataSource} from "@/data-source";
import {Contract} from "@/entities/Contract";
import {Payment} from "@/entities/Payment";

interface GetPaymentSessionUrlParams {
    userId: number;
    contractId: number;
    paymentType: string; // "계약금" 또는 "잔금"
}

export const getPaymentSessionUrlService = async ({
                                                      userId,
                                                      contractId,
                                                      paymentType,
                                                  }: GetPaymentSessionUrlParams): Promise<string> => {
    const contractRepo = AppDataSource.getRepository(Contract);
    const paymentRepo = AppDataSource.getRepository(Payment);

    // 1. 계약 접근 권한 확인
    const contract = await contractRepo.findOne({
        where: {contract_id: contractId},
        relations: ["lessee", "lessee.user"],
    });

    if (!contract || contract.lessee.user.id !== userId) {
        const error: any = new Error("해당 계약에 접근 권한이 없습니다.");
        error.status = 403;
        throw error;
    }

    // 2. 결제 정보 조회
    const payment = await paymentRepo.findOne({
        where: {
            contract: {contract_id: contractId},
            payment_type: paymentType,
            payment_status: "대기",
        },
    });

    // 3. 결제 세션 URL 유효성 확인
    if (!payment || !payment.payment_session_url) {
        const error: any = new Error("결제 세션 URL을 찾을 수 없습니다.");
        error.status = 404;
        throw error;
    }

    return payment.payment_session_url;
};
