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

        const maxRetries = 20;
        const delay = 3000; // 3초
        let status = -1;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 [상태확인#${attempt}] 계약 ${contractId} 상태 조회 중...`);
                status = await leaseContract.getContractStatus(contractBlockchainId);
                console.log(`📘 [상태확인#${attempt}] 상태코드: ${status}`);

                if (status === BlockChainContractStatus.AwaitingPayment) {
                    console.log(`✅ [조건충족] 계약 ${contractId} → 상태 AwaitingPayment 확인됨`);
                    const paymentUrl = await requestStripePayment(contractId);
                    console.log(`💳 [결제세션 생성됨] 계약 ${contractId} → ${paymentUrl}`);
                    return;
                }
            } catch (err) {
                console.error(`⚠️ [상태확인#${attempt}] 상태 조회 실패 (재시도 예정):`, err);
            }

            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        console.warn(`🟥 [서명완료후처리 종료] 계약 ${contractId} → 상태 AwaitingPayment 도달 실패`);
        console.warn(`ℹ️ [최종 상태코드] 계약 ${contractId} → 상태코드: ${status}`);
    } catch (error) {
        console.error(`❌ [에러] handlePostSignatureProcess(${contractId}) 실패:`, error);
    }
};
