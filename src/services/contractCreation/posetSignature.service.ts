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
        console.log(`[서명완료후처리] 계약 ${contractId} → 블록체인 상태 확인 시작`);

        const maxRetries = 5;
        const delay = 2000; // 2초
        let status = -1;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            status = await leaseContract.getContractStatus(contractBlockchainId);
            console.log(`[상태확인#${attempt}] 계약 ${contractId} → 상태코드: ${status}`);

            if (status === BlockChainContractStatus.AwaitingPayment) {
                console.log(`[조건충족] 계약 ${contractId} → 상태 AwaitingPayment 확인됨`);
                const paymentUrl = await requestStripePayment(contractId);
                console.log(`[결제세션 생성됨] 계약 ${contractId} → ${paymentUrl}`);
                return;
            }

            // 마지막이 아니면 기다림
            if (attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        console.log(`[서명완료후처리 종료] 계약 ${contractId} → 상태 AwaitingPayment 도달 실패`);

    } catch (error) {
        console.error(`[에러] handlePostSignatureProcess(${contractId}) 실패:`, error);
    }
};
