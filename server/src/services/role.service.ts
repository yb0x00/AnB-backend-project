import {AppDataSource} from "../data-source";
import {Agent} from "../entities/Agent";
import {Lessor} from "../entities/Lessor";
import {Lessee} from "../entities/Lessee";

export const findUserRole = async (
    userId: number
): Promise<"agent" | "lessor" | "lessee" | null> => {
    const agentRepo = AppDataSource.getRepository(Agent);
    const lessorRepo = AppDataSource.getRepository(Lessor);
    const lesseeRepo = AppDataSource.getRepository(Lessee);

    const agent = await agentRepo.findOne({where: {user: {id: userId}}});
    if (agent) return "agent";

    const lessor = await lessorRepo.findOne({where: {user: {id: userId}}});
    if (lessor) return "lessor";

    const lessee = await lesseeRepo.findOne({where: {user: {id: userId}}});
    if (lessee) return "lessee";

    return null;
};
