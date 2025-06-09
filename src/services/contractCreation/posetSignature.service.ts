import leaseContract from "@/services/blockchain/leaseContract.service";
import {requestStripePayment} from "@/services/payment/stripe/payDown.service";

export const handlePostSignatureProcess = async ({
                                                     contractId,
                                                     contractBlockchainId,
                                                 }: {
    contractId: number;
    contractBlockchainId: number;
}): Promise<void> => {
    try {
        console.log(`🟩 [서명완료후처리 시작] 계약 ${contractId}`);

        // 상태 조회 생략: 3명 서명 완료 시점에서 실행된다고 가정
        console.log(`✅ [3명 서명 완료] 계약 ${contractId} → 결제 세션 생성 시작`);
        const paymentUrl = await requestStripePayment(contractId);
        console.log(`💳 [결제세션 생성됨] 계약 ${contractId} → ${paymentUrl}`);
    } catch (error) {
        console.error(`❌ [에러] handlePostSignatureProcess(${contractId}) 실패:`, error);
    }
};
