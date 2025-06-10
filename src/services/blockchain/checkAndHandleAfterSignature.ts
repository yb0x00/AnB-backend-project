import {getContractStatus} from "@/services/blockchain/getContractStatus";
import {BlockChainContractStatus} from "@/enums/BlockChainContractStatus";
import {handlePostSignatureProcess} from "@/services/contractCreation/posetSignature.service";

export const checkAndHandleAfterSignature = async (
    contractId: number,
    contractBlockchainId: number
) => {
    const maxRetries = 10;
    const delayMs = 3000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const status = await getContractStatus(contractBlockchainId);
        console.log(`[SignatureStatusCheck] Attempt ${attempt}: status=${status}`);

        if (status === BlockChainContractStatus.AwaitingSignature) {
            console.log(`[SignatureStatusCheck] 상태가 AwaitingSignature(2)로 확인됨. 후속 처리 실행`);
            await handlePostSignatureProcess({contractId, contractBlockchainId});
            return;
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    console.warn(`[SignatureStatusCheck] 상태가 AwaitingSignature로 변경되지 않음 → 후속 처리 미실행`);
};
