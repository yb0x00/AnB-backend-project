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

    const propertyRepo = AppDataSource.getRepository(Property);
    const properties = await propertyRepo.find();

    if (properties.length !== 1) {
        throw new Error("Property must contain exactly one item for MVP use.");
    }

    const property = properties[0];


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
