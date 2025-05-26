import {AppDataSource} from "@/data-source";
import {User} from "@/entities/User";
import jwt from "jsonwebtoken";
import {findUserRole} from "./role.service";

export const loginService = async (
    login_id: string,
    password: string
): Promise<{
    access_token: string;
    user: {
        id: number;
        user_name: string;
        role: "agent" | "lessor" | "lessee" | null;
    };
}> => {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({where: {login_id}});

    if (!user || user.password !== password) {
        throw new Error("Invalid login_id or password");
    }

    const role = await findUserRole(user.id);

    const secret = process.env.JWT_SECRET as string;
    const expiresIn = "30d";

    const token = jwt.sign(
        {userId: user.id, wallet_address: user.wallet_address, role},
        secret,
        {expiresIn}
    );

    return {
        access_token: token,
        user: {
            id: user.id,
            user_name: user.user_name,
            role,
        },
    };
};
