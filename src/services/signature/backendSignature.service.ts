import {AppDataSource} from "@/data-source";
import {Contract} from "@/entities/Contract";
import {Signature} from "@/entities/Signature";
import {Lessor} from "@/entities/Lessor";
import {Lessee} from "@/entities/Lessee";
import {Agent} from "@/entities/Agent";
import {User} from "@/entities/User";
import {Notification} from "@/entities/Notification";
import {Wallet, JsonRpcProvider, Contract as EthersContract} from "ethers";
import {handlePostSignatureProcess} from "@/services/contractCreation/posetSignature.service";
import {NotificationType} from "@/enums/NotificationType";
import LeaseContractAbi from "@/abi/LeaseContract.json";

interface CreateBackendSignatureParams {
    callingUserId: number;
    blockchainContractId: number;
    signOnBehalfOfUserId: number;
}

// --- .env에서 필요한 환경 변수 가져오기 ---
const BACKEND_WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY!;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL!;
const LEASE_CONTRACT_ADDRESS = process.env.LEASE_CONTRACT_ADDRESS!;

export const createBackendSignatureService = async ({
                                                        callingUserId,
                                                        blockchainContractId,
                                                        signOnBehalfOfUserId,
                                                    }: CreateBackendSignatureParams) => {
    await AppDataSource.transaction(async (manager) => {
        const contractRepo = manager.getRepository(Contract);
        const signatureRepo = manager.getRepository(Signature);
        const lessorRepo = manager.getRepository(Lessor);
        const lesseeRepo = manager.getRepository(Lessee);
        const agentRepo = manager.getRepository(Agent);
        const notificationRepo = manager.getRepository(Notification);

        const contract = await contractRepo.findOne({
            where: {contract_blockchain_id: blockchainContractId},
            relations: ["lessee", "lessor", "agent"]
        });

        if (!contract) {
            throw new Error("해당 계약이 존재하지 않습니다.");
        }

        let contractPartyUser: User | null = null;
        let partyRole: "lessor" | "lessee" | "agent" | null = null;

        // --- 임대인 확인 ---
        if (contract.lessor?.id) {
            const lessorEntity = await lessorRepo.findOne({
                where: {id: contract.lessor.id},
                relations: ["user"]
            });
            if (lessorEntity?.user?.id === signOnBehalfOfUserId) {
                contractPartyUser = lessorEntity.user;
                partyRole = "lessor";
            }
        }

        // --- 임차인 확인 ---
        const lesseeEntity = await lesseeRepo.findOne({
            where: {id: contract.lessee.id},
            relations: ["user"]
        });
        if (lesseeEntity?.user?.id === signOnBehalfOfUserId) {
            contractPartyUser = lesseeEntity.user;
            partyRole = "lessee";
        }

        // --- 중개인 확인 ---
        const agentEntity = await agentRepo.findOne({
            where: {id: contract.agent.id},
            relations: ["user"]
        });
        if (agentEntity?.user?.id === signOnBehalfOfUserId) {
            contractPartyUser = agentEntity.user;
            partyRole = "agent";
        }

        if (!contractPartyUser || !partyRole) {
            throw new Error("요청된 사용자는 계약의 당사자가 아닙니다.");
        }

        // --- 중복 서명 확인 ---
        const existingSignature = await signatureRepo.findOne({
            where: {
                user: {id: signOnBehalfOfUserId},
                contract: {contract_id: contract.contract_id},
            },
        });

        if (existingSignature) {
            throw new Error("해당 사용자는 이미 이 계약에 서명했습니다.");
        }

        // --- 백엔드 지갑 서명 ---
        const provider = new JsonRpcProvider(SEPOLIA_RPC_URL);
        const wallet = new Wallet(BACKEND_WALLET_PRIVATE_KEY, provider);
        const leaseContract = new EthersContract(LEASE_CONTRACT_ADDRESS, LeaseContractAbi, wallet);

        const messageToSign = `Contract ID: ${blockchainContractId}, Signed On Behalf Of User ID: ${signOnBehalfOfUserId}, Signed At: ${new Date().toISOString()}`;
        const backendSignature = await wallet.signMessage(messageToSign);

        // --- DB에 서명 저장 ---
        const newSignature = signatureRepo.create({
            signature_value: backendSignature,
            signed_message: messageToSign,
            user: contractPartyUser,
            contract: contract,
        });

        await signatureRepo.save(newSignature);

        // --- 스마트컨트랙트 서명 ---
        if (partyRole === "lessee") {
            await leaseContract.signByLessee(blockchainContractId);
        } else if (partyRole === "lessor") {
            await leaseContract.signByLessor(blockchainContractId);
        } else if (partyRole === "agent") {
            await leaseContract.signByAgent(blockchainContractId);
        }

        // --- 알림 삭제 ---
        await notificationRepo.delete({
            user: {id: signOnBehalfOfUserId},
            contract: {contract_id: contract.contract_id},
            notification_type: NotificationType.CONTRACT_CREATION_READY
        });

        // --- 서명 수 3개 완료 시 후속 처리 ---
        const signatureCount = await signatureRepo.count({
            where: {contract: {contract_id: contract.contract_id}},
        });

        if (signatureCount === 3) {
            setImmediate(() => {
                handlePostSignatureProcess(contract.contract_id).catch(console.error);
            });
        }
    });
};
