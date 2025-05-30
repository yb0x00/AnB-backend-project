import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

// 1. Sepolia 연결을 위한 provider (Infura, Alchemy 등)
export const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// 2. 서버에서 사용할 지갑 (주의: 실제 프라이빗키는 .env에 저장)
export const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY!, provider);

// 3. 서비스에서 가져다 쓰기 위한 함수
export const getWallet = () => wallet;
export const getProvider = () => provider;
