import express, {Request, Response} from "express";
import Stripe from "stripe";
import {AppDataSource} from "@/data-source";
import {Contract} from "@/entities/Contract";
import {Payment} from "@/entities/Payment";
import {Notification} from "@/entities/Notification";
import {NotificationType} from "@/enums/NotificationType";
import {ContractStatus} from "@/enums/ContractStatus";
import {demoBalancePaymentSchedulerForContract} from "@/services/scheduler/demo_balancePaymentScheduler.service";
import {confirmFullyPaid} from "@/services/blockchain/confirmFullyPaid";
import {getContractStatus} from "@/services/blockchain/getContractStatus";
import {BlockChainContractStatus} from "@/enums/BlockChainContractStatus";

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

            // 테스트 분기 처리
            if (paymentType === "테스트") {
                console.log("Webhook 테스트 수신 성공");
                console.log("metadata:", session.metadata);
                res.status(200).json({
                    test: true,
                    message: "Webhook 테스트 수신 성공",
                    contractId,
                    paymentType,
                });
                return;
            }

            // 실 데이터 처리
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
                    //"lessor.user",
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

            payment.payment_status = "완료";
            payment.payment_actual_date = new Date();
            await paymentRepo.save(payment);

            const users = [
                contract.lessee?.user,
                contract.lessor,
                contract.agent?.user,
            ].filter(Boolean);

            const userMessageMap = new Map<number, string>();
            let message = "";
            let notificationType: NotificationType;

            switch (paymentType) {
                case "계약금":
                    contract.contract_status = ContractStatus.DOWN_PAYMENT_PAID;
                    await contractRepo.save(contract);

                    notificationType = NotificationType.CONTRACT_DOWN_PAYMENT_CONFIRMED;
                    const lesseeUserId = contract.lessee?.user?.id;
                    const propertyId = contract.property.property_id;

                    if (lesseeUserId) {
                        userMessageMap.set(
                            lesseeUserId,
                            `계약금이 성공적으로 납부되었습니다! 곧 잔금 결제 요청이 전송될 예정입니다.`
                        );
                    }

                    const defaultMessage = `매물번호 ${propertyId}의 계약금 결제가 완료되어 계약이 체결되었습니다.`;
                    users.forEach((user) => {
                        if (!userMessageMap.has(user.id)) {
                            userMessageMap.set(user.id, defaultMessage);
                        }
                    });

                    setTimeout(async () => {
                        try {
                            console.log(`[MVP] 계약 ID ${contract.contract_id} - 1분 후 잔금 결제 요청 시작`);
                            await demoBalancePaymentSchedulerForContract(contract.contract_id);
                            console.log(`[MVP] 계약 ID ${contract.contract_id} - 잔금 결제 요청 완료`);
                        } catch (err) {
                            console.error(`[MVP][오류] 계약 ID ${contract.contract_id} - 잔금 요청 실패`, err);
                        }
                    }, 60 * 1000);
                    break;

                case "잔금":
                    contract.contract_status = ContractStatus.BALANCE_PAYMENT_PAID;
                    await contractRepo.save(contract);
                    message = `매물번호 ${contract.property.property_id}의 잔금이 납부되었습니다.`;
                    notificationType = NotificationType.CONTRACT_BALANCE_PAYMENT_CONFIRMED;

                    try {
                        const downPayment = contract.payments.find((p) => p.payment_type === "계약금");
                        if (!downPayment?.payment_actual_date) {
                            res.status(500).send("Missing down payment date");
                            return;
                        }

                        const downPaymentTimestamp = downPayment.payment_actual_date.getTime();
                        const balancePaymentTimestamp = payment.payment_actual_date.getTime();
                        const blockchainId = contract.contract_blockchain_id;

                        if (blockchainId != null) {
                            await confirmFullyPaid(
                                blockchainId,
                                BigInt(Math.floor(downPaymentTimestamp / 1000)),
                                BigInt(Math.floor(balancePaymentTimestamp / 1000))
                            );

                            const maxRetries = 10;
                            const delay = 2000;
                            let statusOnChain = -1;

                            for (let i = 0; i < maxRetries; i++) {
                                statusOnChain = await getContractStatus(blockchainId);
                                if (statusOnChain === BlockChainContractStatus.Confirmed) break;
                                await new Promise((res) => setTimeout(res, delay));
                            }
                        }
                    } catch (err) {
                        console.error(`[Blockchain][오류] confirmFullyPaid 처리 실패 - contractId=${contract.contract_id}`, err);
                    }
                    break;

                case "보증금 반환":
                    message = `매물번호 ${contract.property.property_id}의 보증금이 반환되었습니다.`;
                    notificationType = NotificationType.CONTRACT_DEPOSIT_RETURNED;
                    break;

                default:
                    res.status(400).send("Unknown paymentType");
                    return;
            }

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
            }

            for (const user of users) {
                const userMessage = userMessageMap.get(user.id) ?? message;

                const notification = notificationRepo.create({
                    user,
                    notification_type: notificationType,
                    notification_message: userMessage,
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
