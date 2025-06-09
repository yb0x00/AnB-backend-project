import {AppDataSource} from "@/data-source";
import {Payment} from "@/entities/Payment";
import {Contract} from "@/entities/Contract";
import {ContractDetail} from "@/entities/ContractDetail";
import {Notification} from "@/entities/Notification";
import Stripe from "stripe";
import {NotificationType} from "@/enums/NotificationType";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const demoBalancePaymentSchedulerForContract = async (contractId: number) => {
    const contractRepo = AppDataSource.getRepository(Contract);
    const detailRepo = AppDataSource.getRepository(ContractDetail);
    const paymentRepo = AppDataSource.getRepository(Payment);
    const notificationRepo = AppDataSource.getRepository(Notification);

    const contract = await contractRepo.findOne({
        where: {contract_id: contractId},
        relations: ["lessee", "lessee.user", "property"],
    });

    if (!contract) throw new Error("Contract not found");

    const detail = await detailRepo.findOne({
        where: {contract: {contract_id: contractId}},
    });

    if (!detail) throw new Error("Contract detail not found");

    const amount = Number(detail.contract_balance_payment);
    const lesseeUser = contract.lessee?.user;

    if (!lesseeUser || !amount) {
        console.warn(`[잔금 스케줄러] 계약 ${contractId}의 결제 또는 유저 정보 없음`);
        return;
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: lesseeUser.email,
        success_url: "https://battle-reminder-0a6.notion.site/Success-20b68585295e80229f56da07c6085169",
        cancel_url: "https://battle-reminder-0a6.notion.site/Error-20b68585295e80f4b6a9c86650d049a2",
        line_items: [
            {
                price_data: {
                    currency: 'krw',
                    product_data: {
                        name: `잔금 결제 - 계약 ID ${contract.contract_id}`,
                    },
                    unit_amount: amount,
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        metadata: {
            contractId: String(contract.contract_id),
            lesseeId: String(contract.lessee.id),
            paymentType: '잔금',
        },
    });

    if (!session.url) {
        console.error(`[Stripe] 세션 URL 생성 실패: 계약 ${contract.contract_id}`);
        throw new Error("Stripe 세션 URL이 생성되지 않았습니다.");
    }

    const payment = paymentRepo.create({
        contract,
        payment_type: "잔금",
        payment_amount: amount,
        payment_method: "Stripe",
        payment_status: "대기",
        payment_session_url: session.url,
    });
    await paymentRepo.save(payment);

    const notification = notificationRepo.create({
        user: lesseeUser,
        notification_type: NotificationType.CONTRACT_BALANCE_PAYMENT_REQUEST,
        notification_message: `매물번호 ${contract.property.property_id}의 잔금 납부일입니다. 결제를 진행해주세요.`,
        is_read: false,
        contract,
        payment,
    });
    await notificationRepo.save(notification);

    console.log(`[잔금 스케줄러] 계약 ${contractId} → 결제 세션 및 알림 생성 완료`);
};
