import {Router} from "express";
import {getContractStatusController} from "@/controllers/blockchain/getContractStatus.controller";

const router = Router();

// /api/contracts/:contractId/status
router.get("/contracts/:contractId/status", getContractStatusController);

export default router;
