import {Request, Response} from "express";
import {getContractStatus} from "@/services/blockchain/getContractStatus";

export const getContractStatusController = async (req: Request, res: Response): Promise<void> => {
    const contractId = parseInt(req.params.contractId);

    if (isNaN(contractId)) {
        res.status(400).json({error: "Invalid contractId"});
        return;
    }

    try {
        const statusBigInt = await getContractStatus(contractId);
        res.status(200).json({contractId, status: Number(statusBigInt)});
    } catch (err) {
        console.error("Failed to fetch blockchain contract status:", err);
        res.status(500).json({error: "Blockchain contract status fetch failed"});
    }
};
