import {AppDataSource} from "@/data-source";
import {Payment} from "@/entities/Payment";
import {Contract} from "@/entities/Contract";
import {Notification} from "@/entities/Notification";
import Stripe from "stripe";
import {NotificationType} from "@/enums/NotificationType"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const demoBalancePaymentSchedulerForContract = async (contractId: number) => {
    const contractRepo = AppDataSource.getRepository(Contract);
    const notificationRepo = AppDataSource.getRepository(Notification);
    const paymentRepo = AppDataSource.getRepository(Payment);

    const contract = await contractRepo.findOne({
        where: {contract_id: contractId},
        relations: ['contract_detail', 'lessee', 'lessee.user', 'property', 'payments'],
    });

    if (!contract) throw new Error("Contract not found");

    const lesseeUser = contract.lessee?.user;
    const payment = contract.payments.find(
        (p) => p.payment_type === '잔금' && p.payment_status === '대기'
    );
    if (!lesseeUser || !payment) return;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: contract.lessee.user.email,
        success_url: "https://battle-reminder-0a6.notion.site/Success-20b68585295e80229f56da07c6085169",
        cancel_url: "https://battle-reminder-0a6.notion.site/Error-20b68585295e80f4b6a9c86650d049a2",
        line_items: [
            {
                price_data: {
                    currency: 'krw',
                    product_data: {
                        name: `잔금 결제 - 계약 ID ${contract.contract_id}`,
                    },
                    unit_amount: payment.payment_amount,
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        metadata: {
            contractId: contract.contract_id,
            lesseeId: String(contract.lessee.id),
            paymentType: '잔금',
        },
    });

    payment.payment_session_url = session.url!;
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
};
