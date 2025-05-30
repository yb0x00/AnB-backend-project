import {AppDataSource} from "@/data-source";
import {User} from "@/entities/User";
import {Property} from "@/entities/Property";
import {Notification} from "@/entities/Notification";
import {NotificationType} from "@/enums/NotificationType";
import {toNotificationResponseDto} from "@/utils/mapper/notification.mapper";
import {ContractRequest} from "@/entities/ContractRequest";
import {Lessee} from "@/entities/Lessee";
import {ContractRequestStatus} from "@/enums/ContractRequest";

export const requestContractService = async (userId: number, propertyId: number) => {
    const userRepo = AppDataSource.getRepository(User);
    const lesseeRepo = AppDataSource.getRepository(Lessee);
    const propertyRepo = AppDataSource.getRepository(Property);
    const contractRequestRepo = AppDataSource.getRepository(ContractRequest);
    const notificationRepo = AppDataSource.getRepository(Notification);

    // 유저 정보 조회
    const user = await userRepo.findOneByOrFail({id: userId});

    // lessee 정보 조회
    const lessee = await lesseeRepo.findOne({
        where: {user: {id: userId}},
        relations: ["user"],
    });

    if (!lessee) {
        throw new Error("해당 사용자는 임차인(Lessee)으로 등록되어 있지 않습니다.");
    }

    // 매물 정보 조회
    const property = await propertyRepo.findOne({
        where: {property_id: propertyId},
        relations: ["lessor", "lessor.user", "agent", "agent.user"],
    });

    if (!property || !property.lessor?.user || !property.agent?.user) {
        throw new Error("매물 정보가 충분하지 않습니다.");
    }

    // ContractRequest 객체 생성 및 저장
    const newRequest = contractRequestRepo.create({
        property: property,
        lessee: lessee,
        lessor: property.lessor.user,
        agent: property.agent,
        status: ContractRequestStatus.PENDING,
        lessorAccepted: false,
        agentAccepted: false,
    });

    const savedRequest = await contractRequestRepo.save(newRequest);

    // 알림 메시지 작성
    const messageLessor = `매물 번호 ${property.property_number}번에 대한 계약 요청이 들어왔습니다.`;
    const messageAgent = `매물 번호 ${property.property_number}번에 대해 ${user.user_name}님이 계약을 요청했습니다.`;

    // 알림 객체 생성
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
            notification_message: messageAgent,
            is_read: false,
            contract: undefined,
            payment: undefined,
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
