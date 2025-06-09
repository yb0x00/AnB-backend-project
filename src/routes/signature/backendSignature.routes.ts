// src/routes/backendSignature.router.ts (MVP용)

import {Router} from "express";
import {authenticate} from "@/middleware/auth.middleware";
import {createBackendSignatureController} from "@/controllers/signature/backendSignature.controller";

const router = Router();

// POST /api/v1/signatures/backend
// 백엔드 지갑을 사용하여 계약에 서명하는 API (MVP 단계)
router.post(
    "/signatures/backend",
    authenticate,    // 1. 사용자 인증 (로그인 여부 확인)
    // authorizeAdmin 미들웨어는 MVP 단계에서 일단 생략
    createBackendSignatureController // 2. 백엔드 서명 처리 로직
);

export default router;