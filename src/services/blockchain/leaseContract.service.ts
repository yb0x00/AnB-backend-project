import {ethers} from "ethers";
import LeaseContractABI from "../../abi/LeaseContract.json";
import {getWallet} from "./blockchain.config";     // 경로 확인 필요

const contractAddress = process.env.LEASE_CONTRACT_ADDRESS!;
const leaseContract = new ethers.Contract(contractAddress, LeaseContractABI, getWallet());

export const getLeaseCounter = async (): Promise<number> => {
    const count = await leaseContract.leaseCounter();
    return Number(count);
};

// 필요한 함수 추가로 export 가능
