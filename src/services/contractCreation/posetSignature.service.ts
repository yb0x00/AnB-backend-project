import leaseContract from "@/services/blockchain/leaseContract.service";
import {BlockChainContractStatus} from "@/enums/BlockChainContractStatus";
import {requestStripePayment} from "@/services/payment/stripe/payDown.service";

export const handlePostSignatureProcess = async ({
                                                     contractId,
                                                     contractBlockchainId
                                                 }: {
    contractId: number;
    contractBlockchainId: number;
}): Promise<void> => {
    try {
        console.log(`[서명완료후처리] 계약 ${contractId} → 블록체인 상태 조회 중...`);

        // 1. getContractStatus(contractId) 호출
        const status: number = await leaseContract.getContractStatus(contractBlockchainId);

        console.log(`[블록체인 상태] 계약 ${contractId} → 상태코드: ${status}`);

        // 2. AwaitingPayment 상태인지 확인
        if (status === BlockChainContractStatus.AwaitingPayment) {
            console.log(`[결제 조건 충족] 계약 ${contractId} → 결제 진행 시작`);

            // 3. Stripe 결제 세션 생성
            const paymentUrl = await requestStripePayment(contractId);

            console.log(`[결제 세션 URL] 계약 ${contractId} → ${paymentUrl}`);

        } else {
            console.log(`[서명완료후처리 중단] 계약 ${contractId} → 상태 AwaitingPayment 아님`);
        }
    } catch (error) {
        console.error(`[에러] handlePostSignatureProcess(${contractId}) 실패:`, error);
    }
};
