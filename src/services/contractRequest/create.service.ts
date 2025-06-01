import {AppDataSource} from "@/data-source";
import {User} from "@/entities/User";
import {Property} from "@/entities/Property";
import {Notification} from "@/entities/Notification";
import {NotificationType} from "@/enums/NotificationType";
import {toNotificationResponseDto} from "@/utils/mapper/notification.mapper";
import {ContractRequest} from "@/entities/ContractRequest";
import {Lessee} from "@/entities/Lessee";
import {Lessor} from "@/entities/Lessor";
import {Agent} from "@/entities/Agent";
import {ContractRequestStatus} from "@/enums/ContractRequest";

export const requestContractService = async (userId: number, propertyId: number) => {
    const userRepo = AppDataSource.getRepository(User);
    const lesseeRepo = AppDataSource.getRepository(Lessee);
    const lessorRepo = AppDataSource.getRepository(Lessor);
    const agentRepo = AppDataSource.getRepository(Agent);
    const propertyRepo = AppDataSource.getRepository(Property);
    const contractRequestRepo = AppDataSource.getRepository(ContractRequest);
    const notificationRepo = AppDataSource.getRepository(Notification);

    // 로그인 유저 확인
    const user = await userRepo.findOneByOrFail({id: userId});

    // Lessee 확인
    const lessee = await lesseeRepo.findOneOrFail({
        where: {user: {id: userId}},
        relations: ["user"],
    });

    // 매물 조회
    const property = await propertyRepo.findOneOrFail({
        where: {property_id: propertyId},
        relations: ["lessor", "lessor.user", "agent", "agent.user"],
    });

    // ContractRequest 생성
    const newRequest = contractRequestRepo.create({
        property,
        lessee,
        lessor: property.lessor,
        agent: property.agent,
        status: ContractRequestStatus.PENDING,
        lessorAccepted: false,
        agentAccepted: false,
    });
    const savedRequest = await contractRequestRepo.save(newRequest);

    // 알림 메시지
    const messageLessor = `매물 번호 ${property.property_number}번에 대한 계약 요청이 들어왔습니다.`;
    const messageAgent = `매물 번호 ${property.property_number}번에 대해 ${user.user_name}님이 계약을 요청했습니다.`;

    // 알림 생성
    const notifications = notificationRepo.create([
        {
            user: {id: property.lessor.user.id},
            notification_type: NotificationType.CONTRACT_REQUEST,
            notification_message: messageLessor,
            is_read: false,
        },
        {
            user: {id: property.agent.user.id},
            notification_type: NotificationType.CONTRACT_REQUEST,
            notification_message: messageAgent,
            is_read: false,
        },
    ]);

    const savedNotifications = await notificationRepo.save(notifications);
    const responseDtos = savedNotifications.map(toNotificationResponseDto);

    return {
        message: "계약 요청 완료 및 알림 전송됨",
        contractRequestId: savedRequest.id,
        notifications: responseDtos,
    };
};
