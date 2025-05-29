import express from "express";
import {requestContract} from "@/services/contract.request.service";
import {asyncHandler} from "@/utils/handlers/asyncHandler";
import {authenticate} from "@/middleware/auth.middleware";

const router = express.Router();

router.post("/request", authenticate, asyncHandler(requestContract));

export default router;