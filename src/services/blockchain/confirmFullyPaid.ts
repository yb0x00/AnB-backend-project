import {Contract} from "ethers";
import abi from "@/abi/LeaseContract.json";
import {getWallet} from "@/services/blockchain/blockchain.config";

export const confirmFullyPaid = async (
    contractId: number,
    depositDownPaymentAt: bigint, // bigint 타입으로 안전하게
    depositBalanceAt: bigint
) => {
    const contract = new Contract(
        process.env.LEASE_CONTRACT_ADDRESS!,
        abi,
        getWallet()
    );

    const tx = await contract.confirmFullyPaid(contractId, depositDownPaymentAt, depositBalanceAt);
    return await tx.wait(); // 트랜잭션 채굴 완료까지 대기
};
