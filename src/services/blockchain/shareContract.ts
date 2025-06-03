import {Contract} from "ethers";
import {getWallet} from "@/services/blockchain/blockchain.config";
import abi from "@/abi/LeaseContract.json";

export const shareContract = async (
    contractId: number,
    contractHash: string,
    startDate: number,
    endDate: number
) => {
    const contract = new Contract(
        process.env.LEASE_CONTRACT_ADDRESS!,
        abi,
        getWallet()
    );

    const tx = await contract.shareContract(contractId, contractHash, startDate, endDate);
    return await tx.wait();
};
