import {Contract} from "ethers";
import abi from "@/abi/LeaseContract.json";
import {getProvider} from "@/services/blockchain/blockchain.config";

export const getContractStatus = async (contractId: number): Promise<number> => {
    const contract = new Contract(
        process.env.LEASE_CONTRACT_ADDRESS!,
        abi,
        getProvider()
    );
    return await contract.getContractStatus(contractId); // enum 형태의 number 반환됨
};
