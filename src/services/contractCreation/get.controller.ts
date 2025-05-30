import {AppDataSource} from "@/data-source";
import {Agent} from "@/entities/Agent";
import {Contract} from "@/entities/Contract";

export const getContractIdForAgent = async (
    userId: number | undefined,
    propertyId: number
): Promise<{ contract_id: number; status: string } | null> => {
    if (!userId) return null;

    const agentRepo = AppDataSource.getRepository(Agent);
    const contractRepo = AppDataSource.getRepository(Contract);

    // 1. 에이전트 조회
    const agent = await agentRepo.findOne({
        where: {
            user: {
                id: userId,
            },
        },
        relations: ["user"],
    });

    if (!agent) return null;

    // 2. 계약 조회 (property.property_id, agent.id 기준)
    const contract = await contractRepo.findOne({
        where: {
            property: {
                property_id: propertyId,
            },
            agent: {
                id: agent.id,
            },
        },
        relations: ["property", "agent"],
    });

    if (!contract) return null;

    // 3. 반환
    return {
        contract_id: contract.contract_id,
        status: contract.contract_status,
    };
};