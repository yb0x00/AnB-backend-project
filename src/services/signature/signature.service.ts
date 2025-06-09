import { AppDataSource } from "@/data-source";
import { Contract } from "@/entities/Contract";
import { Signature } from "@/entities/Signature";
import { Lessor } from "@/entities/Lessor";
import { Lessee } from "@/entities/Lessee";
import { Agent } from "@/entities/Agent";
import { User } from "@/entities/User";
import { Notification } from "@/entities/Notification";
import { verifyMessage, Wallet, JsonRpcProvider, Contract as EthersContract } from "ethers";
import { handlePostSignatureProcess } from "@/services/contractCreation/posetSignature.service";
import { NotificationType } from "@/enums/NotificationType";
import LeaseContractAbi from "@/abi/LeaseContract.json";

interface CreateSignatureParams {
    userId: number;
    contractId: number;
    address: string; // 현재는 사용하지 않지만 받아두기만 함
    signature: string;
    message: string;
}

// 환경변수에서 스마트컨트랙트 정보 로드
const BACKEND_WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY!;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL!;
const LEASE_CONTRACT_ADDRESS = process.env.LEASE_CONTRACT_ADDRESS!;

export const createSignatureService = async ({
                                                 userId,
                                                 contractId,
                                                 signature,
                                                 message,
                                             }: CreateSignatureParams) => {
    await AppDataSource.transaction(async (manager) => {
        const contractRepo = manager.getRepository(Contract);
        const signatureRepo = manager.getRepository(Signature);
        const userRepo = manager.getRepository(User);
        const lesseeRepo = manager.getRepository(Lessee);
        const lessorRepo = manager.getRepository(Lessor);
        const agentRepo = manager.getRepository(Agent);
        const notificationRepo = manager.getRepository(Notification);

        const contract = await contractRepo.findOne({
            where: { contract_id: contractId },
        });
        if (!contract) throw new Error("해당 계약이 존재하지 않습니다.");

        const user = await userRepo.findOneByOrFail({ id: userId });

        // 지갑 주소 검증: 사용자가 실제 자신의 지갑으로 서명했는지 확인
        const recovered = verifyMessage(message, signature);
        if (recovered.toLowerCase() !== user.wallet_address!.toLowerCase()) {
            throw new Error("서명자 지갑 주소가 일치하지 않습니다.");
        }

        // 역할 확인
        const lessee = await lesseeRepo.findOne({ where: { id: contract.lessee.id }, relations: ["user"] });
        const lessor = await lessorRepo.findOne({ where: { id: contract.lessor.id }, relations: ["user"] });
        const agent = await agentRepo.findOne({ where: { id: contract.agent.id }, relations: ["user"] });

        const isValidRole = [lessee?.user?.id, lessor?.user?.id, agent?.user?.id].includes(userId);
        if (!isValidRole) {
            throw new Error("계약의 당사자가 아닙니다.");
        }

        // 중복 서명 방지
        const existing = await signatureRepo.findOne({
            where: {
                user: { id: userId },
                contract: { contract_id: contractId },
            },
        });
        if (existing) {
            throw new Error("이미 서명한 사용자입니다.");
        }

        // DB에 서명 저장
        const newSignature = signatureRepo.create({
            signature_value: signature,
            signed_message: message,
            user,
            contract,
        });
        await signatureRepo.save(newSignature);

        // 스마트컨트랙트 연결
        const provider = new JsonRpcProvider(SEPOLIA_RPC_URL);
        const backendWallet = new Wallet(BACKEND_WALLET_PRIVATE_KEY, provider);
        const leaseContract = new EthersContract(LEASE_CONTRACT_ADDRESS, LeaseContractAbi, backendWallet);

        // 역할에 따라 블록체인 서명 함수 호출
        if (user.id === lessee?.user?.id) {
            await leaseContract.signByLessee(contract.contract_blockchain_id);
        } else if (user.id === lessor?.user?.id) {
            await leaseContract.signByLessor(contract.contract_blockchain_id);
        } else if (user.id === agent?.user?.id) {
            await leaseContract.signByAgent(contract.contract_blockchain_id);
        }

        // 서명 요청 알림 삭제
        await notificationRepo.delete({
            user: { id: userId },
            contract: { contract_id: contractId },
            notification_type: NotificationType.CONTRACT_CREATION_READY
        });

        // 서명 수 확인 후 후속 처리
        const count = await signatureRepo.count({
            where: { contract: { contract_id: contractId } },
        });

        if (count === 3) {
            setImmediate(() => {
                handlePostSignatureProcess(contractId).catch(console.error);
            });
        }
    });
};
