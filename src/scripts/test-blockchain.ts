import "dotenv/config";
import {getLeaseCounter} from "../services/blockchain/leaseContract.service"; // .env 적용

(async () => {
    try {
        const counter = await getLeaseCounter();
        console.log("현재 leaseCounter 값:", counter);
    } catch (err) {
        console.error("블록체인 연동 실패:", err);
    }
})();
