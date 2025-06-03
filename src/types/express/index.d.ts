export type UserPayload = {
    id: number;
    role: "lessor" | "agent" | "lessee";
};

declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}
