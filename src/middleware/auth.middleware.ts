import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export const authenticate: RequestHandler = (req, res, next) => {
    console.log("[auth] 미들웨어 진입");

    const authHeader = req.headers.authorization;
    console.log("[auth] Authorization 헤더:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("[auth] 헤더 없음 또는 형식 오류");
        res.status(401).json({ message: "Authorization header missing" });
        return;
    }

    const token = authHeader.split(" ")[1];
    console.log("[auth] 파싱된 토큰:", token);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: number;
        };
        console.log("[auth] 디코딩된 사용자 정보:", decoded);

        (req as any).authUser = { id: decoded.userId };
        console.log("[auth] req.authUser 설정:", (req as any).authUser);

        next();
    } catch (err) {
        console.error("[auth] JWT 검증 실패:", err);
        res.status(401).json({ message: "Invalid or expired token" });
    }
};
