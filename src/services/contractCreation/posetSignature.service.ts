import leaseContract from "@/services/blockchain/leaseContract.service";
import {BlockChainContractStatus} from "@/enums/BlockChainContractStatus";
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

        const delay = 40000; // 30초 기다림
        console.log(`⏳ [대기] ${delay / 1000}초 후 블록체인 상태 확인 예정...`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        console.log(`🔍 [상태확인] 계약 ${contractId} 상태 조회 중...`);
        const status = await leaseContract.getContractStatus(contractBlockchainId);
        console.log(`📘 [상태확인] 상태코드: ${status}`);

        if (status === BlockChainContractStatus.AwaitingPayment) {
            console.log(`✅ [조건충족] 계약 ${contractId} → 상태 AwaitingPayment 확인됨`);
            const paymentUrl = await requestStripePayment(contractId);
            console.log(`💳 [결제세션 생성됨] 계약 ${contractId} → ${paymentUrl}`);
        } else {
            console.warn(`🟥 [서명완료후처리 종료] 계약 ${contractId} → 상태 AwaitingPayment 아님`);
        }
    } catch (error) {
        console.error(`❌ [에러] handlePostSignatureProcess(${contractId}) 실패:`, error);
    }
};
