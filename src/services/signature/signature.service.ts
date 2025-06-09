import {AppDataSource} from "@/data-source";
import {Contract} from "@/entities/Contract";
import {Signature} from "@/entities/Signature";
import {Lessor} from "@/entities/Lessor";
import {Lessee} from "@/entities/Lessee";
import {Agent} from "@/entities/Agent";
import {User} from "@/entities/User";
import {Notification} from "@/entities/Notification";
import {verifyMessage, Wallet, JsonRpcProvider, Contract as EthersContract} from "ethers";
import {handlePostSignatureProcess} from "@/services/contractCreation/posetSignature.service";
import {NotificationType} from "@/enums/NotificationType";
import LeaseContractAbi from "@/abi/LeaseContract.json";

interface CreateSignatureParams {
    userId: number;
    contractId: number;
    address: string;
    signature: string;
    message: string;
}

const BACKEND_WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY!;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL!;
const LEASE_CONTRACT_ADDRESS = process.env.LEASE_CONTRACT_ADDRESS!;

export const createSignatureService = async ({
                                                 userId,
                                                 contractId,
                                                 signature,
                                                 message,
                                             }: CreateSignatureParams) => {
    console.log("createSignatureService 진입");
    console.log("요청 정보:", {userId, contractId, signature, message});

    await AppDataSource.transaction(async (manager) => {
        const contractRepo = manager.getRepository(Contract);
        const signatureRepo = manager.getRepository(Signature);
        const userRepo = manager.getRepository(User);
        const lesseeRepo = manager.getRepository(Lessee);
        const lessorRepo = manager.getRepository(Lessor);
        const agentRepo = manager.getRepository(Agent);
        const notificationRepo = manager.getRepository(Notification);

        // 계약 조회 + 관계 포함
        const contract = await contractRepo.findOne({
            where: {contract_id: contractId},
            relations: ["lessee", "lessor", "agent"],
        });
        if (!contract) {
            console.error("계약이 존재하지 않음:", contractId);
            throw new Error("해당 계약이 존재하지 않습니다.");
        }

        if (!contract.lessee || !contract.lessor || !contract.agent) {
            console.error("계약의 당사자 정보 누락됨:", contract);
            throw new Error("계약에 필요한 역할 정보가 누락되었습니다.");
        }

        console.log("계약 정보:", {
            id: contract.contract_id,
            lesseeId: contract.lessee.id,
            lessorId: contract.lessor.id,
            agentId: contract.agent.id,
        });

        // 사용자 조회
        const user = await userRepo.findOneByOrFail({id: userId});
        if (!user.wallet_address) {
            console.error("사용자 지갑 주소가 없음:", userId);
            throw new Error("DB에 지갑 주소가 등록되어 있지 않습니다.");
        }

        // 서명 검증
        const recovered = verifyMessage(message, signature);
        console.log("서명 검증:", {
            message,
            signature,
            recovered,
            expected: user.wallet_address,
        });

        if (recovered.toLowerCase() !== user.wallet_address.toLowerCase()) {
            console.error("서명자 지갑 주소 불일치");
            throw new Error("서명자 지갑 주소가 일치하지 않습니다.");
        }

        // 역할 확인
        const lessee = await lesseeRepo.findOne({where: {id: contract.lessee.id}, relations: ["user"]});
        const lessor = await lessorRepo.findOne({where: {id: contract.lessor.id}, relations: ["user"]});
        const agent = await agentRepo.findOne({where: {id: contract.agent.id}, relations: ["user"]});

        const isValidRole = [lessee?.user?.id, lessor?.user?.id, agent?.user?.id].includes(userId);
        console.log("사용자 역할 확인:", {userId, isValidRole});
        if (!isValidRole) {
            throw new Error("계약의 당사자가 아닙니다.");
        }

        // 중복 서명 방지
        const existing = await signatureRepo.findOne({
            where: {
                user: {id: userId},
                contract: {contract_id: contractId},
            },
        });
        if (existing) {
            console.warn("이미 서명된 사용자입니다:", userId);
            throw new Error("이미 서명한 사용자입니다.");
        }

        // 서명 저장
        const newSignature = signatureRepo.create({
            signature_value: signature,
            signed_message: message,
            user,
            contract,
        });
        await signatureRepo.save(newSignature);
        console.log("서명 저장 완료");

        // 스마트컨트랙트 연결 및 서명
        const provider = new JsonRpcProvider(SEPOLIA_RPC_URL);
        const backendWallet = new Wallet(BACKEND_WALLET_PRIVATE_KEY, provider);
        const leaseContract = new EthersContract(LEASE_CONTRACT_ADDRESS, LeaseContractAbi, backendWallet);

        if (user.id === lessee?.user?.id) {
            console.log("블록체인 서명: 임차인");
            await leaseContract.signByLessee(contract.contract_blockchain_id);
        } else if (user.id === lessor?.user?.id) {
            console.log("블록체인 서명: 임대인");
            await leaseContract.signByLessor(contract.contract_blockchain_id);
        } else if (user.id === agent?.user?.id) {
            console.log("블록체인 서명: 중개인");
            await leaseContract.signByAgent(contract.contract_blockchain_id);
        }

        // 알림 삭제
        await notificationRepo.delete({
            user: {id: userId},
            contract: {contract_id: contractId},
            notification_type: NotificationType.CONTRACT_CREATION_READY,
        });
        console.log("알림 삭제 완료");

        // 서명 수 확인
        const count = await signatureRepo.count({
            where: {contract: {contract_id: contractId}},
        });
        console.log("현재 서명 수:", count);

        if (count === 3) {
            console.log("모든 서명 완료 – 후속 처리 시작");
            setImmediate(() => {
                handlePostSignatureProcess(contractId).catch(console.error);
            });
        }
    });
};
