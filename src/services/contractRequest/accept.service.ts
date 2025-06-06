import {AppDataSource} from "@/data-source";
import {ContractRequest} from "@/entities/ContractRequest";
import {ContractRequestStatus} from "@/enums/ContractRequest";
import {NotFoundError} from "@/errors/NotFoundError";
import {UnauthorizedError} from "@/errors/UnauthorizedError";
import {Notification} from "@/entities/Notification";
import {NotificationType} from "@/enums/NotificationType";
import leaseContract from "@/services/blockchain/leaseContract.service"; // 이 서비스 파일의 구현이 중요합니다.
import {Contract} from "@/entities/Contract";
import {User} from "@/entities/User";
import {ContractStatus} from "@/enums/ContractStatus";

// 트랜잭션 확정을 위한 대기 시간 (밀리초)
const TRANSACTION_CONFIRMATION_TIMEOUT = 60 * 1000; // 60초
// 트랜잭션 확정을 위한 재시도 간격 (밀리초)
const TRANSACTION_POLLING_INTERVAL = 5 * 1000; // 5초

export const acceptContractRequestService = async (
    propertyId: number,
    userId: number,
    role: "lessor" | "agent"
) => {
    const contractRequestRepo = AppDataSource.getRepository(ContractRequest);
    const notificationRepo = AppDataSource.getRepository(Notification);
    const contractRepo = AppDataSource.getRepository(Contract);
    const userRepo = AppDataSource.getRepository(User);

    console.log(`[시작] 계약 요청 승인 - propertyId: ${propertyId}, userId: ${userId}, role: ${role}`);

    const contractRequest = await contractRequestRepo.findOne({
        where: {
            property: {property_id: propertyId},
            ...(role === "lessor" ? {lessor: {user: {id: userId}}} : {}),
            ...(role === "agent" ? {agent: {user: {id: userId}}} : {}),
        },
        relations: [
            "property",
            "lessee",
            "lessee.user",
            "lessor",
            "lessor.user",
            "agent",
            "agent.user",
        ],
    });

    if (!contractRequest) {
        console.error(`[오류] 계약 요청을 찾을 수 없습니다.`);
        throw new NotFoundError("해당 계약 요청이 존재하지 않습니다.");
    }

    if (
        (role === "lessor" && contractRequest.lessor.user.id !== userId) ||
        (role === "agent" && contractRequest.agent.user.id !== userId)
    ) {
        console.error(`[오류] 승인 권한 없음`);
        throw new UnauthorizedError("해당 사용자에게 승인 권한이 없습니다.");
    }

    // 승인 처리
    if (role === "lessor") {
        contractRequest.lessorAccepted = true;
    } else {
        contractRequest.agentAccepted = true;
    }

    console.log(`[정보] 승인 처리 완료. lessorAccepted: ${contractRequest.lessorAccepted}, agentAccepted: ${contractRequest.agentAccepted}`);

    await notificationRepo.delete({
        user: {id: userId},
        notification_type: NotificationType.CONTRACT_REQUEST,
    });

    let blockchainContractId: number | null = null;
    let blockchainMessage = "";

    if (contractRequest.lessorAccepted && contractRequest.agentAccepted) {
        contractRequest.status = ContractRequestStatus.APPROVED;
        console.log(`[정보] 양측 승인 완료 → 블록체인 계약 여부 확인 중...`);

        // 블록체인에서 현재 propertyId에 해당하는 계약 ID 조회 시도
        const existingContractId = await leaseContract.getContractId(propertyId);
        const existingIdNum = Number(existingContractId);
        console.log(`[정보] 현재 블록체인 contractId: ${existingContractId}`);

        if (existingContractId === 0n) { // BigInt 비교
            console.log(`[정보] 기존 블록체인 계약 없음 → 새로 생성 시도`);

            const lesseeUser = await userRepo.findOneByOrFail({id: contractRequest.lessee.user.id});
            const lessorUser = await userRepo.findOneByOrFail({id: contractRequest.lessor.user.id});
            const agentUser = await userRepo.findOneByOrFail({id: contractRequest.agent.user.id});

            const lesseeWallet = lesseeUser.wallet_address;
            const lessorWallet = lessorUser.wallet_address;
            const agentWallet = agentUser.wallet_address;

            console.log(`[지갑] lessee: ${lesseeWallet}, lessor: ${lessorWallet}, agent: ${agentWallet}`);

            if (!lesseeWallet || !lessorWallet || !agentWallet) {
                throw new Error("지갑 주소가 누락된 사용자가 있어 블록체인 계약을 생성할 수 없습니다.");
            }

            try {
                // 블록체인 계약 생성 트랜잭션 전송
                // leaseContract.createContract는 트랜잭션 응답 객체를 반환해야 합니다.
                const txResponse = await leaseContract.createContract({
                    propertyId,
                    lesseeId: lesseeWallet,
                    lessorId: lessorWallet,
                    agentId: agentWallet,
                });

                console.log(`[블록체인] 계약 생성 트랜잭션 전송 완료 (Tx Hash: ${txResponse.hash})`);

                // 트랜잭션이 확정될 때까지 대기
                // ethers.js의 경우 txResponse.wait() 메서드를 사용
                // web3.js의 경우 .on('receipt') 또는 getTransactionReceipt를 폴링
                const receipt = await txResponse.wait(1); // 1 confirmations 대기
                if (!receipt || receipt.status === 0) { // 트랜잭션 실패 확인
                    console.error(`[오류] 블록체인 계약 생성 트랜잭션 실패: ${receipt?.transactionHash}`);
                    throw new Error("블록체인 계약 생성 트랜잭션이 실패했습니다.");
                }

                console.log(`[블록체인] 계약 생성 트랜잭션 확정 완료 (Block Number: ${receipt.blockNumber})`);

                // 트랜잭션 확정 후, 블록체인에서 새로운 contractId 조회
                // 트랜잭션이 포함된 블록이 충분히 전파되었을 때 조회해야 정확합니다.
                // 필요한 경우, 잠시 대기 후 조회하거나, 스마트 컨트랙트 이벤트 리스너를 사용하는 것이 더 견고합니다.
                let retries = 0;
                let foundContractId: bigint | null = null;
                const startTime = Date.now();

                while (Date.now() - startTime < TRANSACTION_CONFIRMATION_TIMEOUT && foundContractId === null) {
                    const currentContractId = await leaseContract.getContractId(propertyId);
                    if (currentContractId !== 0n) {
                        foundContractId = currentContractId;
                        break;
                    }
                    console.log(`[블록체인] 새 contractId 조회 시도 중... (${++retries}회, 현재 ID: ${currentContractId})`);
                    await new Promise(resolve => setTimeout(resolve, TRANSACTION_POLLING_INTERVAL));
                }

                if (foundContractId === null) {
                    throw new Error("블록체인 계약 ID를 지정된 시간 내에 조회하지 못했습니다.");
                }

                blockchainContractId = Number(foundContractId);
                blockchainMessage = "블록체인에 새 계약이 성공적으로 생성되었습니다.";
                console.log(`[블록체인] 새 contractId 최종 조회: ${blockchainContractId}`);

            } catch (error) {
                console.error(`[오류] 블록체인 계약 생성 중 오류 발생:`, error);

                // 에러가 Error 객체인지 확인하는 타입 가드
                if (error instanceof Error) {
                    throw new Error(`블록체인 계약 생성 실패: ${error.message}`);
                } else {
                    // Error 객체가 아닌 다른 타입의 에러일 경우
                    throw new Error(`블록체인 계약 생성 실패: 알 수 없는 오류`);
                }
            }

        } else {
            blockchainContractId = existingIdNum;
            blockchainMessage = "이미 블록체인에 계약이 존재합니다.";
            console.log(`[블록체인] 기존 계약 존재 - ID: ${existingIdNum}`);
        }

        // DB에 새로운 계약 저장
        const newContract = contractRepo.create({
            contract_status: ContractStatus.PENDING, // 블록체인 처리 후 PENDING 상태로 시작
            contract_blockchain_id: blockchainContractId,
            contract_blockchain_status: "SUBMITTED", // 트랜잭션은 제출되었음을 의미
            property: contractRequest.property,
            lessee: contractRequest.lessee,
            lessor: contractRequest.lessor,
            agent: contractRequest.agent,
        });

        const savedContract = await contractRepo.save(newContract);
        console.log(`[DB] 새로운 계약 저장 완료 - contractId: ${savedContract.contract_id}`);

        // 알림 생성
        const lesseeUser = contractRequest.lessee.user;
        const lessorUser = contractRequest.lessor.user;
        const agentUser = contractRequest.agent.user;

        const agentName = agentUser.user_name;
        const lessorName = lessorUser.user_name;
        const propertyNumber = contractRequest.property.property_number;

        await notificationRepo.save([
            notificationRepo.create({
                user: lesseeUser,
                notification_type: NotificationType.CONTRACT_CREATION_REQUEST,
                notification_message: `${propertyNumber}번 계약 요청이 승인되었습니다. ${agentName} 중개사가 현재 계약서를 작성 중입니다.`,
                contract: savedContract,
            }),
            notificationRepo.create({
                user: lessorUser,
                notification_type: NotificationType.CONTRACT_CREATION_REQUEST,
                notification_message: `${agentName} 중개사가 현재 ${propertyNumber}번 계약서를 작성 중입니다.`,
                contract: savedContract,
            }),
            notificationRepo.create({
                user: agentUser,
                notification_type: NotificationType.CONTRACT_CREATION_REQUEST,
                notification_message: `${lessorName} 임대인이 ${propertyNumber}번 계약 요청을 수락하였습니다. 계약서를 작성해주세요.`,
                contract: savedContract,
            }),
        ]);

        console.log(`[알림] 계약 생성 알림 저장 완료`);
    }

    // 계약 요청 상태 업데이트 (블록체인 처리 여부와 관계없이)
    await contractRequestRepo.save(contractRequest);
    console.log(`[완료] contractRequest 상태 저장 완료`);

    return {
        message: "계약 요청이 성공적으로 승인되었습니다.",
        blockchainNotice: blockchainMessage,
        blockchainContractId,
        status: contractRequest.status,
    };
};