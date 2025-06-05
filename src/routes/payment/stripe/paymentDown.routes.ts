import {Router} from "express";
import {authenticate} from "@/middleware/auth.middleware";
import {getPaymentSessionUrlController} from "@/controllers/payment/stripe/paymentDown.controller";

const router = Router();

router.get("/payments/session-url", authenticate, getPaymentSessionUrlController);

export default router;
