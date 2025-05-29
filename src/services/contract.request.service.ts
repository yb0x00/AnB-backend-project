import {Request, Response} from "express";
import {AppDataSource} from "@/data-source";
import {User} from "@/entities/User";
import {Property} from "@/entities/Property";
import {Notification} from "@/entities/Notification";
import {NotificationType} from "@/enums/NotificationType";
import {toNotificationResponseDto} from "@/utils/mapper/notification.mapper";

// ✅ 커스텀 Request 타입 지정
interface AuthenticatedRequest extends Request {
    user?: User;
}

export const requestContract = async (req: AuthenticatedRequest, res: Response) => {
    const user_id = req.user?.id; // JWT에서 추출된 사용자 ID
    const {property_id} = req.body;

    if (!user_id || !property_id) {
        return res.status(400).json({message: "user_id와 property_id는 필수입니다."});
    }

    const userRepo = AppDataSource.getRepository(User);
    const propertyRepo = AppDataSource.getRepository(Property);
    const notificationRepo = AppDataSource.getRepository(Notification);

    try {
        const user = await userRepo.findOneByOrFail({id: user_id});

        const property = await propertyRepo.findOne({
            where: {property_id},
            relations: ["lessor", "lessor.user", "agent", "agent.user"],
        });

        if (!property) {
            return res.status(404).json({message: "해당 매물을 찾을 수 없습니다."});
        }

        if (!property.lessor?.user || !property.agent?.user) {
            return res.status(400).json({
                message: "매물에 집주인 또는 중개인이 등록되어 있지 않습니다.",
            });
        }

        const messageLessor = `매물 번호 ${property.property_number}번에 대한 계약 요청이 들어왔습니다.`;
        const messageToagent = `매물 번호 ${property.property_number}번에 대해 ${user.user_name}님이 계약을 요청했습니다.`;

        const notifications = notificationRepo.create([
            {
                user: property.lessor.user,
                notification_type: NotificationType.CONTRACT_REQUEST,
                notification_message: messageLessor,
                is_read: false,
                contract: undefined,
                payment: undefined,
            },
            {
                user: property.agent.user,
                notification_type: NotificationType.CONTRACT_REQUEST,
                notification_message: messageToagent,
                is_read: false,
                contract: undefined,
                payment: undefined,
            },
        ]);

        const saved = await notificationRepo.save(notifications);
        const responseDtos = saved.map(toNotificationResponseDto);

        return res.status(200).json({
            message: "계약 요청 완료 및 알림 전송됨",
            notifications: responseDtos,
        });
    } catch (err) {
        console.error("계약 요청 오류:", err);
        return res.status(500).json({message: "서버 오류"});
    }
};
