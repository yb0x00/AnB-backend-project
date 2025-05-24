export type SeedUser = {
    user_name: string;
    login_id: string;
    email: string;
    password: string;
    wallet_address: string;
    role: "agent" | "lessor" | "lessee";
    agent_license_number?: string;
};
