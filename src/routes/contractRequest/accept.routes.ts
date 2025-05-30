import express from "express";
import {authenticate} from "@/middleware/auth.middleware";
import {asyncHandler} from "@/utils/handlers/asyncHandler";
import {acceptContractRequestController} from "@/controllers/contractRequest/accept.controller";

const router = express.Router();

router.post("/contracts/request/accept", authenticate, asyncHandler(acceptContractRequestController));

export default router;