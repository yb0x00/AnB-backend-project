import {AppDataSource} from "@/data-source";
import {Contract} from "@/entities/Contract";
import {ContractDetail} from "@/entities/ContractDetail";
import Stripe from "stripe";
import {Payment} from "@/entities/Payment";
import {NotificationType} from "@/enums/NotificationType";
import {Notification} from "@/entities/Notification";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const requestStripePayment = async (contractId: number): Promise<void> => {
    const contractRepo = AppDataSource.getRepository(Contract);
    const detailRepo = AppDataSource.getRepository(ContractDetail);
    const paymentRepo = AppDataSource.getRepository(Payment);
    const notificationRepo = AppDataSource.getRepository(Notification);

    const contract = await contractRepo.findOne({
        where: {contract_id: contractId},
        relations: ["lessee", "lessee.user", "property"],
    });

    if (!contract) throw new Error("계약 정보를 찾을 수 없습니다.");

    const detail = await detailRepo.findOne({
        where: {contract: {contract_id: contractId}},
    });

    if (!detail) throw new Error("계약 세부 정보가 없습니다.");

    const amount = Number(detail.contract_down_payment); // bigint → number
    const customerEmail = contract.lessee.user.email;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: customerEmail,
        line_items: [
            {
                price_data: {
                    currency: "krw",
                    product_data: {
                        name: "계약금 결제",
                    },
                    unit_amount: amount,
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        success_url: "https://battle-reminder-0a6.notion.site/Success-20b68585295e80229f56da07c6085169",
        cancel_url: "https://battle-reminder-0a6.notion.site/Error-20b68585295e80f4b6a9c86650d049a2",
        metadata: {
            contractId: String(contractId),
            lesseeId: String(contract.lessee.id),
            paymentType: "계약금",
        },
    });

    // 세션 URL이 존재할 때만 Payment 객체 생성
    if (session.url) {
        const payment = paymentRepo.create({
            contract: contract,
            payment_type: "계약금",
            payment_amount: amount,
            payment_method: "Stripe",
            payment_status: "대기",
            payment_session_url: session.url,
        });
        await paymentRepo.save(payment);

        // --- 알림 생성 ---
        const lesseeUser = contract.lessee.user;
        // Ensure property relation is loaded for propertyId
        const propertyId = contract.property.property_id;

        const notification = notificationRepo.create({
            user: lesseeUser,
            notification_type: NotificationType.CONTRACT_DOWN_PAYMENT_REQUEST,
            notification_message: `매물번호 ${propertyId}에 대한 계약금 결제를 진행해 주세요.`,
            is_read: false,
            contract: contract,
            payment: payment,
        });

        await notificationRepo.save(notification);

    } else {
        console.error(`[Stripe] 결제 세션 URL이 생성되지 않았습니다 (contractId=${contractId})`);
        throw new Error("Stripe 세션 URL 생성 실패");
    }
};
