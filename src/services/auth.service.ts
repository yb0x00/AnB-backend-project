import {User} from "@/entities/User";
import jwt from "jsonwebtoken";
import {findUserRole} from "./role.service";
import {AppDataSource} from "@/data-source";
import {Property} from "@/entities/Property";

export const loginService = async (
    login_id: string,
    password: string
): Promise<{
    access_token: string;
    user: {
        userId: number;
        user_name: string;
        role: "agent" | "lessor" | "lessee" | null;
        property_id: number;
    };
}> => {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({where: {login_id}});

    if (!user) {
        throw new Error("User not found");
    }

    if (user.password !== password) {
        throw new Error("Incorrect password");
    }

    const role = await findUserRole(user.id);
    console.log("로그인 시 유저 role:", role);

    const secret = process.env.JWT_SECRET as string;
    const expiresIn = "30d";

    const token = jwt.sign(
        {userId: user.id, wallet_address: user.wallet_address, role},
        secret,
        {expiresIn}
    );

    const propertyRepo = AppDataSource.getRepository(Property);
    let property: Property | null = null;

    if (role === "lessor") {
        property = await propertyRepo
            .createQueryBuilder("property")
            .leftJoin("property.lessor", "lessor")
            .leftJoin("lessor.user", "user")
            .where("user.id = :userId", {userId: user.id})
            .getOne();
    } else if (role === "agent") {
        property = await propertyRepo
            .createQueryBuilder("property")
            .leftJoin("property.agent", "agent")
            .leftJoin("agent.user", "user")
            .where("user.id = :userId", {userId: user.id})
            .getOne();
    } else if (role === "lessee") {
        let agentEmail: string | null = null;

        switch (user.email) {
            case "lessee01@example.com":
                agentEmail = "agent01@example.com";
                break;
            case "lessee02@example.com":
                agentEmail = "agent02@example.com";
                break;
            case "lessee03@example.com":
                agentEmail = "agent03@example.com";
                break;
            case "lessee04@example.com":
                agentEmail = "agent04@example.com";
                break;
            default:
                throw new Error("No agent mapping defined for this lessee");
        }

        property = await propertyRepo
            .createQueryBuilder("property")
            .leftJoin("property.agent", "agent")
            .leftJoin("agent.user", "agentUser")
            .where("agentUser.email = :email", {email: agentEmail})
            .getOne();
    }

    if (!property) {
        throw new Error("No property found for the user.");
    }

    console.log("최종 반환 직전 role:", role);
    return {
        access_token: token,
        user: {
            userId: user.id,
            user_name: user.user_name,
            role,
            property_id: property.property_id,
        },
    };
};
