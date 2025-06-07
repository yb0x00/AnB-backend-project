import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createTestPaymentSession = async (contractId: number, paymentType: string) => {
    return await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        metadata: {
            contractId: contractId.toString(),
            paymentType,
        },
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    unit_amount: 10000,
                    product_data: {
                        name: `${paymentType} for contract ${contractId}`,
                    },
                },
                quantity: 1,
            },
        ],
        success_url: "https://battle-reminder-0a6.notion.site/Success-20b68585295e80229f56da07c6085169",
        cancel_url: "https://battle-reminder-0a6.notion.site/Error-20b68585295e80f4b6a9c86650d049a2",
    });
};
