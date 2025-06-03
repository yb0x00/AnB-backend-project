import {AppDataSource} from "@/data-source";
import {Contract} from "@/entities/Contract";

export const getActiveContractsService = async () => {
    const contractRepo = AppDataSource.getRepository(Contract);

    const contracts = await contractRepo.find({
        where: {
            contract_status: 'PENDING',
        },
        relations: ["lessee.user", "lessor", "property"],
        order: {contract_created_at: "DESC"},
    });

    return contracts.map((contract) => {
        const lesseeName = contract.lessee.user.user_name;
        const lessorName = contract.lessor.user_name;
        const propertyNumber = contract.property.property_number;

        return {
            contractId: contract.contract_id,
            description: `${lesseeName}님과 ${lessorName}님의 계약서 / 매물번호 - ${propertyNumber}`,
        };
    });
};
