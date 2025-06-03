import { Router } from "express";
import {authenticate} from "@/middleware/auth.middleware";
import {createContractDetailController} from "@/controllers/contractCreation/writeDetail.controller";

const router = Router();

router.post("/contracts/:contractId/detail", authenticate, createContractDetailController);

export default router;
