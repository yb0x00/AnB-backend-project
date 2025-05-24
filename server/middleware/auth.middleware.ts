import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

export const authenticate: RequestHandler = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Authorization header missing" });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: number;
        };
        (req as any).user = { id: decoded.userId };
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid or expired token" });
        return;
    }
};
