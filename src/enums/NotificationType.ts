export enum NotificationType {
    CONTRACT_REQUEST = "CONTRACT_REQUEST",           // 계약 요청
    CONTRACT_CREATION_REQUEST = "CONTRACT_CREATION_REQUEST", // 계약서 작성 요청
    CONTRACT_CREATION_READY = "CONTRACT_CREATION_READY", // 계약서 작성 완료
    CONTRACT_DOWN_PAYMENT_REQUEST = "CONTRACT_DOWN_PAYMENT_REQUEST", // '계약금' 결제 요청
    CONTRACT_DOWN_PAYMENT_CONFIRMED = "CONTRACT_DOWN_PAYMENT_CONFIRMED", // '계약금' 결제 완료
    CONTRACT_BALANCE_PAYMENT_REQUEST = "CONTRACT_FINAL_PAYMENT_REQUEST", // '잔금' 결제 요청
    CONTRACT_BALANCE_PAYMENT_CONFIRMED = "CONTRACT_FINAL_PAYMENT_CONFIRMED", // '잔금' 결제 완료
    CONTRACT_DEPOSIT_RETURNED = "CONTRACT_DEPOSIT_RETURNED", // '보증금 반환' 결제 완료
}