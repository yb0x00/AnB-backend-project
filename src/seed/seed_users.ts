import * as fs from "fs";
import * as path from "path";
import {AppDataSource} from "@/data-source";
import {User} from "@/entities/User";
import {Agent} from "@/entities/Agent";
import {Lessor} from "@/entities/Lessor";
import {Lessee} from "@/entities/Lessee";
import {SeedUser} from "./types";

export const seedUsers = async () => {
    const filePath = path.resolve(__dirname, "users_seed.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const seedData: SeedUser[] = JSON.parse(raw);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        for (const userData of seedData) {
            const {role, agent_license_number, ...userInfo} = userData;

            const existing = await queryRunner.manager.findOne(User, {
                where: {email: userInfo.email},
            });

            if (existing) {
                console.log(`이미 존재하는 유저: ${userInfo.login_id}`);
                continue;
            }

            const user = queryRunner.manager.create(User, userInfo);
            await queryRunner.manager.save(User, user);

            if (role === "agent") {
                const agent = queryRunner.manager.create(Agent, {
                    user,
                    agent_license_number,
                    agency: undefined,
                    property: undefined,
                    phone: user.phone
                });
                await queryRunner.manager.save(Agent, agent);
            } else if (role === "lessor") {
                const lessor = queryRunner.manager.create(Lessor, {
                    user,
                    property: undefined,
                });
                await queryRunner.manager.save(Lessor, lessor);
            } else if (role === "lessee") {
                const lessee = queryRunner.manager.create(Lessee, {
                    user,
                    contract: undefined,
                });
                await queryRunner.manager.save(Lessee, lessee);
            }

            console.log(`유저 생성 완료: ${user.login_id} (${role})`);
        }

        await queryRunner.commitTransaction();
        console.log("모든 유저 시딩 완료");
    } catch (err) {
        console.error("시딩 중 오류 발생, 롤백합니다.", err);
        await queryRunner.rollbackTransaction();
    } finally {
        await queryRunner.release();
    }
};
