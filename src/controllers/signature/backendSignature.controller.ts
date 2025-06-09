// src/controllers/backendSignature.controller.ts

import { Request, Response } from "express";
import {createBackendSignatureService} from "@/services/signature/backendSignature.service";

export const createBackendSignatureController = async (req: Request, res: Response): Promise<void> => {
    try {
        const callingUserId = req.user?.id;

        // 요청 바디에서 블록체인 계약 ID (number)와 대리 서명할 사용자 ID를 받음
        const { blockchain_contract_id, user_id: signOnBehalfOfUserId } = req.body;

        // 필수 파라미터 누락 및 타입 검사
        if (!callingUserId || !blockchain_contract_id || !signOnBehalfOfUserId) {
            res.status(400).json({ message: "필수 파라미터가 누락되었습니다. (blockchain_contract_id, user_id)" });
            return;
        }

        // blockchain_contract_id가 number 타입인지 확인
        if (typeof blockchain_contract_id !== 'number') {
            res.status(400).json({ message: "blockchain_contract_id는 숫자 타입이어야 합니다." });
            return;
        }

        await createBackendSignatureService({
            callingUserId: callingUserId,
            blockchainContractId: blockchain_contract_id,
            signOnBehalfOfUserId: signOnBehalfOfUserId
        });

        res.status(201).json({ message: "백엔드 서명이 성공적으로 저장되었습니다." });

    } catch (err: any) {
        console.error("백엔드 서명 생성 실패:", err);

        if (err.message === "해당 계약이 존재하지 않습니다.") {
            res.status(404).json({ message: err.message });
        } else if (err.message === "해당 사용자는 이미 이 계약에 서명했습니다.") {
            res.status(409).json({ message: err.message });
        } else if (err.message === "요청된 사용자는 계약의 당사자가 아닙니다.") {
            res.status(422).json({ message: err.message });
        } else if (err.message === "백엔드 지갑의 프라이빗 키가 설정되지 않았습니다.") {
            res.status(500).json({ message: "서버 설정 오류: 백엔드 서명에 문제가 발생했습니다." });
        }
        else {
            res.status(500).json({ message: "백엔드 서명 처리 중 오류 발생" });
        }
    }
};