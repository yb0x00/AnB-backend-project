import { Router } from "express";
import {createSignatureController} from "@/controllers/signature/signature.controller";
import {authenticate} from "@/middleware/auth.middleware";

const router = Router();

router.post("/signature", authenticate, createSignatureController);

export default router;
