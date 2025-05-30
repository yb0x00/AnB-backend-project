import { Request, Response, NextFunction, RequestHandler } from "express";

// Express 비동기 핸들러 래퍼
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
