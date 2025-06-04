export enum ContractStatus {
    // 계약 생성 단계 (0~4)
    AwaitingApproval = 0,   // 기본값
    Drafting = 1,
    AwaitingSignature = 2,
    AwaitingPayment = 3,
    Confirmed = 4,

    // 계약 변동 단계 (5~7)
    AwaitingExtension = 5,        // 연장 여부 대기
    AwaitingEarlyTermination = 6, // 중도 퇴거 대기
    AwaitingModification = 7,     // 수정 확인 대기

    // 계약 종료 단계 (8~9)
    AwaitingDepositRefund = 8,    // 보증금 반환 대기
    Terminated = 9
}
