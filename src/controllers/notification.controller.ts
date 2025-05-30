import {Request, Response} from "express";
import {getUserNotifications} from "@/services/notification.service";

export const getNotifications = async (
    req: Request,
    res: Response
): Promise<void> => {
    const userId = (req as any).user.id;

    try {
        const notifications = await getUserNotifications(userId);
        res.json(notifications);
    } catch (error) {
        console.error("Notification fetch error:", error);
        res.status(500).json({message: "Internal server error"});
    }
};
