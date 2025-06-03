import {AppDataSource} from "@/data-source";
import {Contract} from "@/entities/Contract";

export const getContractByPropertyService = async (propertyId: number, userId: number) => {
    const contractRepo = AppDataSource.getRepository(Contract);

    const contract = await contractRepo.findOne({
        where: {property: {property_id: propertyId}},
        relations: [
            "property",
            "lessor",
            "agent", "agent.user",
            "lessee", "lessee.user",
        ],
    });

    if (!contract) {
        throw {status: 403, message: "해당 조건을 만족하는 계약이 존재하지 않습니다."};
    }

    const isAuthorized =
        contract.lessor.id === userId ||
        contract.agent.user.id === userId ||
        contract.lessee.user.id === userId;

    if (!isAuthorized) {
        throw {status: 403, message: "해당 property에 대한 권한이 없습니다."};
    }

    return {
        contractId: contract.contract_id,
        status: contract.contract_status,
        contractBlockchainId: contract.contract_blockchain_id,
    };
};
