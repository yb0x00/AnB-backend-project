import {AppDataSource} from "@/data-source";
import {ContractDetail} from "@/entities/ContractDetail";

export const getContractDetailService = async (contractId: number) => {
    const detailRepo = AppDataSource.getRepository(ContractDetail);

    const detail = await detailRepo.findOne({
        where: {contract: {contract_id: contractId}},
        relations: ["contract"], // contract 필드 로드
    });

    if (!detail) return null;

    const {
        contract,
        ...detailOnly
    } = detail;

    return {
        ...detailOnly,
        contract_blockchain_id: contract.contract_blockchain_id,
    };
};
