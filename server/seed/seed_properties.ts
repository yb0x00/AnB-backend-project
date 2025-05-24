import * as fs from "fs/promises";
import * as path from "path";
import {AppDataSource} from "../src/data-source";
import {Property} from "../src/entities/Property";
import {PropertyStatus} from "../src/enums/PropertyStatus";
import {Agent} from "../src/entities/Agent";
import {Lessor} from "../src/entities/Lessor";
import {
    SEED_AGENT_USER_NAME,
    SEED_LESSOR_USER_NAME,
} from "./constants";

export const seedProperties = async () => {
    const filePath = path.resolve(__dirname, "properties_seed.json");

    try {
        // 1. 데이터베이스 초기화 (필요 시)
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // 2. JSON 파일 읽기 및 파싱
        const raw = await fs.readFile(filePath, "utf-8");
        const propertyDataList = JSON.parse(raw);

        if (!Array.isArray(propertyDataList)) {
            throw new Error("Seed 파일의 데이터 형식이 배열이 아닙니다.");
        }

        // 3. 트랜잭션 시작
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 4. Agent 조회
            const agent = await queryRunner.manager
                .createQueryBuilder(Agent, "agent")
                .leftJoinAndSelect("agent.user", "user")
                .where("user.user_name = :name", {name: SEED_AGENT_USER_NAME})
                .getOne();

            // 5. Lessor 조회
            const lessor = await queryRunner.manager
                .createQueryBuilder(Lessor, "lessor")
                .leftJoinAndSelect("lessor.user", "user")
                .where("user.user_name = :name", {name: SEED_LESSOR_USER_NAME})
                .getOne();


            // 6. Property 시딩
            for (const data of propertyDataList) {
                const property = queryRunner.manager.create(Property, {
                    ...data,
                    property_status: PropertyStatus.AVAILABLE,
                    agent,
                    lessor,
                });

                await queryRunner.manager.save(Property, property);
                console.log(`시딩 완료: ${property.property_headline}`);
            }

            await queryRunner.commitTransaction();
            console.log("모든 Property 시딩 완료");
        } catch (err) {
            console.error("Property 시딩 중 오류 발생, 롤백합니다.", err);
            await queryRunner.rollbackTransaction();
        } finally {
            await queryRunner.release();
        }
    } catch (err) {
        console.error("시딩 파일 로딩 또는 초기화 오류:", err);
    }
};

// 직접 실행될 경우
if (require.main === module) {
    seedProperties().then(() => process.exit(0));
}
