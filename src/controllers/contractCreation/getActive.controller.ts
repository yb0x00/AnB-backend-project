import {Request, Response} from "express"; //
import {getActiveContractsService} from "@/services/contractCreation/getActive.service";

export const getActiveContractsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;

        console.log("[DEBUG] req.user.role", req.user?.role);

        if (!userId || !role) {
            res.status(401).json({message: "Unauthorized"});
            return;
        }

        const contracts = await getActiveContractsService(userId, role);
        res.status(200).json(contracts);
    } catch (err) {
        console.error("Error fetching contracts:", err);
        res.status(500).json({message: "Internal Server Error"});
    }
};