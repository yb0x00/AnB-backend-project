import { Request, Response } from "express";
import { getContractByPropertyService } from "@/services/contractCreation/get.service";

export const getContractByPropertyController = async (
    req: Request,
    res: Response
): Promise<void> => {
    const propertyId = Number(req.query.property_id);
    const user = req.user;

    if (!propertyId || !user) {
        res.status(400).json({ message: "property_id는 필수입니다." });
        return;
    }

    try {
        const result = await getContractByPropertyService(propertyId, user.id);
        res.status(200).json(result);
    } catch (error: any) {
        console.error("Error in getContractByPropertyController:", error); // 로그 추가
        if (error.status === 403) {
            res.status(403).json({ message: error.message });
        } else {
            res.status(500).json({ message: "서버 오류" });
        }
    }
};
