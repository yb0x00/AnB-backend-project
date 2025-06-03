import {Request, Response} from "express";
import {getActiveContractsService} from "@/services/contractCreation/getActive.service";

export const getActiveContractsController = async (req: Request, res: Response) => {
    try {
        const result = await getActiveContractsService();
        res.status(200).json(result);
    } catch (err) {
        console.error("계약 목록 조회 오류:", err);
        res.status(500).json({message: "계약 목록 조회 중 오류 발생"});
    }
};
