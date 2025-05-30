import {AppDataSource} from "@/data-source";
import {ContractRequest} from "@/entities/ContractRequest";
import {ContractRequestStatus} from "@/enums/ContractRequest";
import {Contract} from "@/entities/Contract";
import leaseContract from "@/services/blockchain/leaseContract.service";

export const acceptContractRequestService = async (userId: number, propertyId: number) => {
    const contractRequestRepo = AppDataSource.getRepository(ContractRequest);
    const contractRepo = AppDataSource.getRepository(Contract);

    const contractRequest = await contractRequestRepo.findOne({
        where: {property: {property_id: propertyId}},
        relations: ["lessor", "agent", "agent.user", "lessee", "lessee.user", "property"],
    });

    if (!contractRequest) throw new Error("계약 요청을 찾을 수 없습니다.");

    // 권한 확인
    if (contractRequest.lessor.id === userId) {
        contractRequest.lessorAccepted = true;
    } else if (contractRequest.agent.user.id === userId) {
        contractRequest.agentAccepted = true;
    } else {
        throw new Error("요청자는 계약 승인 권한이 없습니다.");
    }

    // 두 명 모두 승인 완료 시
    if (contractRequest.lessorAccepted && contractRequest.agentAccepted) {
        console.log(`[블록체인 계약 생성 시도] propertyId=${propertyId}`);
        contractRequest.status = ContractRequestStatus.APPROVED;

        const lesseeWallet = contractRequest.lessee.user.wallet_address;
        const lessorWallet = contractRequest.lessor.wallet_address;
        const agentWallet = contractRequest.agent.user.wallet_address;

        if (!lesseeWallet || !lessorWallet || !agentWallet) {
            throw new Error("세 주체 중 하나 이상에 지갑 주소가 없습니다.");
        }

        const tx = await leaseContract.createContract({
            propertyId: propertyId,
            lesseeId: lesseeWallet,
            lessorId: lessorWallet,
            agentId: agentWallet,
        });
        console.log("[블록체인 계약 생성 시도]", {
            propertyId,
            lesseeWallet,
            lessorWallet,
            agentWallet,
        });

        const receipt = await tx.wait();
        //const txHash = receipt.transactionHash;
        //console.log(`[블록체인 계약 생성 완료] txHash=${txHash}`);

        const contract = contractRepo.create({
            contract_status: "PENDING",
            contract_hash: "", // 필요시 hash 로직 추가
            contract_address: process.env.LEASE_CONTRACT_ADDRESS!,
            contract_blockchain_status: "CONFIRMED",
            lessor: contractRequest.lessor,
            lessee: contractRequest.lessee,
            agent: contractRequest.agent,
            property: contractRequest.property,
        });

        await contractRepo.save(contract);
    }

    await contractRequestRepo.save(contractRequest);
    return {message: "계약 요청 승인 처리 완료"};
};
