import {Request, Response} from "express";
import {getContractDetailService} from "@/services/contractCreation/getDetail.service";

export const getContractDetailController = async (req: Request, res: Response): Promise<void> => {
    const contractId = Number(req.params.contractId);
    if (isNaN(contractId)) {
        res.status(400).json({message: "Invalid contract ID."});
        return;
    }

    try {
        const detail = await getContractDetailService(contractId);

        if (!detail) {
            res.status(404).json({message: "Contract detail not found."});
            return;
        }

        res.status(200).json(detail);
    } catch (error) {
        console.error("Error in getContractDetailController:", error);
        res.status(500).json({message: "Internal server error."});
    }
};

