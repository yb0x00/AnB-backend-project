import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import {getContractDetailController} from "@/controllers/contractCreation/getDetailcontroller";

const router = Router();

router.get("/contracts/:contractId/detail/get", authenticate, getContractDetailController);

export default router;
