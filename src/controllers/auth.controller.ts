import {Request, Response} from "express";
import {loginService} from "../services/auth.service";

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const {login_id, password} = req.body;
        const result = await loginService(login_id, password);
        res.json(result);
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({message: "Internal server error"});
    }
};
