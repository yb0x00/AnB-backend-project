// dtos/notification.dto.ts

import { NotificationType } from "../enums/NotificationType";

export interface NotificationResponseDto {
    notification_id: number;
    notification_type: NotificationType;
    notification_message: string;
    contract_id?: number | null;
    payment_id?: number | null;
}
