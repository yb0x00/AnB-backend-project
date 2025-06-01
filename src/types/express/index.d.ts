import {User} from "@/entities/User";

declare global {
    namespace Express {
        interface User {
            id: number;
            role: "lessor" | "agent" | "lessee";
        }

        interface Request {
            user?: User;
        }
    }
}
