// import {AppDataSource} from "@/data-source";
// import {Contract} from "@/entities/Contract";
//
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//     apiVersion: "2023-10-16", // 버전 확인 필요
// });
//
// export const requestStripePayment = async (contractId: number): Promise<string> => {
//     const contractRepo = AppDataSource.getRepository(Contract);
//     const contract = await contractRepo.findOne({
//         where: {contract_id: contractId},
//         relations: ["lessee", "lessee.user"], // 결제자 정보 필요
//     });
//
//     if (!contract) throw new Error("계약 정보를 찾을 수 없습니다.");
//
//     const amount = Math.floor(contract.deposit_amount * 100); // 단위: cents
//     const customerEmail = contract.lessee.user.email;
//
//     const session = await stripe.checkout.sessions.create({
//         payment_method_types: ["card"],
//         customer_email: customerEmail,
//         line_items: [
//             {
//                 price_data: {
//                     currency: "krw",
//                     product_data: {
//                         name: "보증금 결제",
//                     },
//                     unit_amount: amount,
//                 },
//                 quantity: 1,
//             },
//         ],
//         mode: "payment",
//         success_url: `${process.env.FRONTEND_URL}/payment/success?contractId=${contractId}`,
//         cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
//         metadata: {
//             contractId: String(contractId),
//             lesseeId: String(contract.lessee.id),
//         },
//     });
//
//     return session.url!;
// };
