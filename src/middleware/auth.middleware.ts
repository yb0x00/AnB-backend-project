import {RequestHandler} from "express";
import jwt from "jsonwebtoken";

export const authenticate: RequestHandler = (req, res, next) => {
    console.log("[auth] 미들웨어 진입");

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("Authorization 헤더 없음 또는 형식 오류");
        res.status(401).json({message: "Authorization header missing"});
        return; // 여기선 void 반환이라 괜찮음
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

        (req as any).user = {
            id: decoded.userId,
            role: decoded.role,
        };

        next();
    } catch (err) {
        console.error("JWT 검증 실패:", err);
        res.status(401).json({message: "Invalid or expired token"});
        return;
    }
};