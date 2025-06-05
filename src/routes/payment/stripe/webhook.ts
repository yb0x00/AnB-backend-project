import express, {Request, Response} from "express";
import Stripe from "stripe";
import {AppDataSource} from "@/data-source";
import {Contract} from "@/entities/Contract";
import {Payment} from "@/entities/Payment";
import {Notification} from "@/entities/Notification";
import {NotificationType} from "@/enums/NotificationType";
import {ContractStatus} from "@/enums/ContractStatus";
import {demoBalancePaymentSchedulerForContract} from "@/services/scheduler/demo_balancePaymentScheduler.service";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

router.post(
    "/stripe/webhook",
    express.raw({type: "application/json"}),
    async (req: Request, res: Response): Promise<void> => {
        const sig = req.headers["stripe-signature"]!;
        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err) {
            console.error("Webhook signature verification failed:", err);
            res.status(400).send("Webhook Error");
            return;
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const contractId = Number(session.metadata?.contractId);
            const paymentType = session.metadata?.paymentType;

            if (!contractId || !paymentType) {
                res.status(400).send("Missing metadata");
                return;
            }

            const contractRepo = AppDataSource.getRepository(Contract);
            const paymentRepo = AppDataSource.getRepository(Payment);
            const notificationRepo = AppDataSource.getRepository(Notification);

            const contract = await contractRepo.findOne({
                where: {contract_id: contractId},
                relations: [
                    "payments",
                    "property",
                    "lessee",
                    "lessee.user",
                    "lessor",
                    "lessor.user",
                    "agent",
                    "agent.user",
                ],
            });

            if (!contract) {
                res.status(404).send("Contract not found");
                return;
            }

            const payment = contract.payments.find(
                (p) => p.payment_type === paymentType && p.payment_status === "대기"
            );

            if (!payment) {
                console.warn(`[Webhook] Payment not found for contractId=${contractId}, type=${paymentType}`);
                res.status(404).send("Payment not found");
                return;
            }

            // 결제 정보 업데이트
            payment.payment_status = "완료";
            payment.payment_actual_date = new Date();
            await paymentRepo.save(payment);

            // 상태 및 알림 분기 처리
            let message = "";
            let notificationType: NotificationType;

            switch (paymentType) {
                case "계약금":
                    contract.contract_status = ContractStatus.DOWN_PAYMENT_PAID;
                    await contractRepo.save(contract);
                    message = `매물번호 ${contract.property.property_id}의 계약금 결제가 완료되어 계약이 체결되었습니다.`;
                    notificationType = NotificationType.CONTRACT_DOWN_PAYMENT_CONFIRMED;

                    //시연 - 1분 후 잔금 결제 요청 발송
                    setTimeout(async () => {
                        try {
                            console.log(`[MVP] 계약 ID ${contract.contract_id} - 1분 후 잔금 결제 요청 시작`);

                            // runBalancePaymentSchedulerForContract()는 특정 계약만 대상으로 하는 함수여야 함
                            await demoBalancePaymentSchedulerForContract(contract.contract_id);

                            console.log(`[MVP] 계약 ID ${contract.contract_id} - 잔금 결제 요청 완료`);
                        } catch (err) {
                            console.error(`[MVP][오류] 계약 ID ${contract.contract_id} - 잔금 요청 실패`, err);
                        }
                    }, 60 * 1000); // 1분 후 실행

                    break;

                case "잔금":
                    contract.contract_status = ContractStatus.BALANCE_PAYMENT_PAID;
                    await contractRepo.save(contract);
                    message = `매물번호 ${contract.property.property_id}의 잔금이 납부되었습니다.`;
                    notificationType = NotificationType.CONTRACT_BALANCE_PAYMENT_CONFIRMED;
                    break;

                case "보증금 반환":
                    message = `매물번호 ${contract.property.property_id}의 보증금이 반환되었습니다.`;
                    notificationType = NotificationType.CONTRACT_DEPOSIT_RETURNED;
                    break;

                default:
                    console.warn(`[Webhook] Unknown payment type: ${paymentType}`);
                    res.status(400).send("Unknown paymentType");
                    return;
            }

            // 사용자 알림 전송 (각 역할의 user 연결된 필드 사용)
            const users = [
                contract.lessee?.user,
                contract.lessor,
                contract.agent?.user,
            ].filter(Boolean);

            // 결제 요청 알림 삭제
            let deleteType: NotificationType | undefined;
            if (paymentType === "계약금") {
                deleteType = NotificationType.CONTRACT_DOWN_PAYMENT_REQUEST;
            } else if (paymentType === "잔금") {
                deleteType = NotificationType.CONTRACT_BALANCE_PAYMENT_REQUEST;
            }

            if (deleteType && contract.lessee?.user) {
                await notificationRepo.delete({
                    user: contract.lessee.user,
                    contract,
                    notification_type: deleteType,
                });
                console.log(`[Webhook] ${paymentType} 요청 알림 삭제 완료 (userId=${contract.lessee.user.id})`);
            }

            for (const user of users) {
                const notification = notificationRepo.create({
                    user,
                    notification_type: notificationType,
                    notification_message: message,
                    is_read: false,
                    contract,
                    payment,
                });

                await notificationRepo.save(notification);
            }

            console.log(`[Webhook] ${paymentType} 결제 완료 → 계약 ${contractId} 처리 완료`);
            res.status(200).json({received: true});
        } else {
            res.status(200).send("Unhandled event");
        }
    }
);

export default router;
