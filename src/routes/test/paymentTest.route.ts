import {Router} from "express";
import {handleTestPayment} from "@/controllers/test/paymentTest.controller";

const router = Router();
router.post("/payment-test", handleTestPayment);
export default router;