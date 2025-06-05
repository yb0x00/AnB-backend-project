import {AppDataSource} from '@/data-source';
import {Contract} from '@/entities/Contract';
import {Notification} from '@/entities/Notification';
import {NotificationType} from '@/enums/NotificationType';
import {Payment} from '@/entities/Payment';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const runBalancePaymentScheduler = async () => {
    const contractRepo = AppDataSource.getRepository(Contract);
    const notificationRepo = AppDataSource.getRepository(Notification);
    const paymentRepo = AppDataSource.getRepository(Payment);

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

    const contracts = await contractRepo
        .createQueryBuilder('contract')
        .leftJoinAndSelect('contract.contract_detail', 'detail')
        .leftJoinAndSelect('contract.lessee', 'lessee')
        .leftJoinAndSelect('lessee.user', 'lesseeUser')
        .leftJoinAndSelect('contract.payments', 'payment')
        .where('detail.contract_balance_payment_date = :today', {today})
        .andWhere('contract.contract_status = :status', {status: 'DOWN_PAYMENT_PAID'}) // 필요 시 enum으로 변경
        .getMany();

    for (const contract of contracts) {
        const lesseeUser = contract.lessee?.user;
        const payment = contract.payments.find(
            (p) => p.payment_type === '잔금' && p.payment_status === '대기'
        );

        if (!lesseeUser || !payment) continue;

        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL}/success`,
                cancel_url: `${process.env.FRONTEND_URL}/cancel`,
                line_items: [{
                    price_data: {
                        currency: 'krw',
                        product_data: {
                            name: `잔금 결제 - 계약 ID ${contract.contract_id}`,
                        },
                        unit_amount: payment.payment_amount,
                    },
                    quantity: 1,
                }],
                metadata: {
                    contractId: contract.contract_id,
                    paymentType: '잔금',
                },
            });

            payment.payment_session_url = session.url!;
            await paymentRepo.save(payment);

            const notification = notificationRepo.create({
                user: lesseeUser,
                notification_type: NotificationType.CONTRACT_BALANCE_PAYMENT_REQUEST,
                notification_message: `오늘은 매물번호 ${contract.property.property_id}의 잔금 납부일입니다. 결제를 진행해주세요.`,
                is_read: false,
                contract,
                payment,
            });

            await notificationRepo.save(notification);
        } catch (error) {
            console.error(`[스케줄러][오류] 계약 ID ${contract.contract_id} 잔금 결제 세션 생성 실패`, error);
        }
    }


    console.log(`[스케줄러] 잔금 요청 알림 완료. 대상 계약 수: ${contracts.length}`);
};
