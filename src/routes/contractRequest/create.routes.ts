import express from "express";
import {authenticate} from "@/middleware/auth.middleware";  //로그인 여부 검증 -> 유저 정보 추가
import {asyncHandler} from "@/utils/handlers/asyncHandler"; //비동기 에러 처리
import {requestController} from "@/controllers/contractRequest/request.controller"; //계약 요청 처리 컨트롤러 함수

const router = express.Router();

router.post("/contracts/request", authenticate, asyncHandler(requestController));
//모듈로 사용하기 위함
export default router;
