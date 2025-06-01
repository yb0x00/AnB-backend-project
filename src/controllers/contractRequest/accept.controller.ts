import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { acceptContractRequestService } from "@/services/contractRequest/accept.service";

export const acceptContractRequestController = async (req: Request, res: Response) => {
    console.log("컨트롤러 진입");

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;

    if (!token) {
        console.warn("Authorization 토큰 없음");
        return res.status(401).json({ message: "토큰이 필요합니다." });
    }

    const decoded: any = jwt.decode(token);
    console.log("JWT 디코드 결과:", decoded);

    const userId = decoded?.userId;
    const role = decoded?.role;

    if (!userId || (role !== "lessor" && role !== "agent")) {
        console.warn("권한 없음 - role:", role);
        return res.status(403).json({ message: "권한이 없습니다." });
    }

    const { property_id } = req.body;

    if (!property_id) {
        return res.status(400).json({ message: "property_id는 필수입니다." });
    }

    try {
        const result = await acceptContractRequestService(property_id, userId, role);
        return res.status(200).json(result);
    } catch (error) {
        console.error("계약 요청 승인 중 오류:", error);
        return res.status(500).json({ message: "서버 오류" });
    }
};
