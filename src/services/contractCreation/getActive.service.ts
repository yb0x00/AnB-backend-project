import {AppDataSource} from "@/data-source";
import {Contract} from "@/entities/Contract";
import {Lessor} from "@/entities/Lessor";
import {Lessee} from "@/entities/Lessee";
import {Agent} from "@/entities/Agent";
import {User} from "@/entities/User";

export const getActiveContractsService = async (
    userId: number,
    role: "lessor" | "lessee" | "agent"
) => {
    console.log(`[DEBUG] getActiveContractsService called with userId: ${userId}, role: ${role}`);

    const contractRepo = AppDataSource.getRepository(Contract);
    let roleId: number | undefined;

    if (role === "lessor") {
        const lessor = await AppDataSource.getRepository(Lessor).findOne({
            where: {user: {id: userId}},
        });
        roleId = lessor?.id;
        console.log(`[DEBUG] Lessor roleId: ${roleId}`);
    } else if (role === "lessee") {
        const lessee = await AppDataSource.getRepository(Lessee).findOne({
            where: {user: {id: userId}},
        });
        roleId = lessee?.id;
        console.log(`[DEBUG] Lessee roleId: ${roleId}`);
    } else if (role === "agent") {
        const agent = await AppDataSource.getRepository(Agent).findOne({
            where: {user: {id: userId}},
        });
        roleId = agent?.id;
        console.log(`[DEBUG] Agent roleId: ${roleId}`);
    }

    if (!roleId) {
        console.log("[DEBUG] No matching roleId found. Returning empty array.");
        return [];
    }

    const contracts = await contractRepo.find({
        where: {
            contract_status: "PENDING",
            [role]: {id: roleId},
        },
        relations: ["lessor", "lessee.user", "property"],
        order: {contract_created_at: "DESC"},
    });

    console.log(`[DEBUG] Found ${contracts.length} contract(s)`);

    const result = [];

    for (const contract of contracts) {
        const lesseeName = contract.lessee.user.user_name;

        // 👉 Lessor의 User 조회
        const lessorId = contract.lessor.id;
        const lessor = await AppDataSource.getRepository(Lessor).findOne({
            where: {id: lessorId},
            relations: ["user"],
        });

        const lessorName = lessor?.user.user_name || "(이름 없음)";
        const propertyNumber = contract.property.property_number;

        console.log(`[DEBUG] Processing contract ${contract.contract_id}: lessee=${lesseeName}, lessor=${lessorName}, propertyNumber=${propertyNumber}`);

        result.push({
            contractId: contract.contract_id,
            description: `${lesseeName}(임차인)님과 ${lessorName}(임대인)님의 계약서\n매물번호 - ${propertyNumber}`
        });
    }

    return result;
};
