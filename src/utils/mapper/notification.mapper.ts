import { Notification } from "@/entities/Notification";
import { NotificationResponseDto } from "@/dtos/notification.dto";

export const toNotificationResponseDto = (
    notification: Notification
): NotificationResponseDto => ({
    notification_id: notification.notification_id,
    notification_type: notification.notification_type,
    notification_message: notification.notification_message,
    contract_id: notification.contract?.contract_id ?? null,
    payment_id: notification.payment?.payment_id ?? null,
});
