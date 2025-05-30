import {ethers} from "ethers";
import * as dotenv from "dotenv";
import LeaseContractAbi from "@/abi/LeaseContract.json";
import {wallet} from "@/services/blockchain/blockchain.config";

dotenv.config();

const leaseContract = new ethers.Contract(
    process.env.LEASE_CONTRACT_ADDRESS!,          // .env에서 주소
    LeaseContractAbi as any,                      // 타입 에러 방지를 위한 캐스팅
    wallet
);

export default leaseContract;
