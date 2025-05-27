import {NotificationResponseDto} from "@/dtos/notification.dto";
import {AppDataSource} from "@/data-source";
import {Notification} from "@/entities/Notification";

export async function getUserNotifications(
    userId: number
): Promise<NotificationResponseDto[]> {
    const notifications = await AppDataSource.getRepository(Notification).find({
        where: {
            user: {id: userId},
            is_read: false,
        },
        relations: ["contract", "payment"],
        order: {created_at: "DESC"},
    });

    return notifications.map((n: Notification) => ({
        notification_id: n.notification_id,
        notification_type: n.notification_type,
        notification_message: n.notification_message,
        contract_id: n.contract?.contract_id ?? null,
        payment_id: n.payment?.payment_id ?? null,
    }));
}