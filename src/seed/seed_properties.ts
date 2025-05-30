import * as fs from "fs/promises";
import * as path from "path";
import {Property} from "@/entities/Property";
import {PropertyStatus} from "@/enums/PropertyStatus";
import {Agent} from "@/entities/Agent";
import {Lessor} from "@/entities/Lessor";
import {AppDataSource} from "@/data-source";
import {SEED_AGENT_USER_NAME, SEED_LESSOR_USER_NAME} from "./constants";

export const seedProperties = async () => {
    const filePath = path.resolve(__dirname, "properties_seed.json");

    try {
        // // 1. 데이터베이스 초기화 (필요 시)
        // if (!AppDataSource.isInitialized) {
        //     await AppDataSource.initialize();
        // }

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

        // 퀀스 리셋 (property_number 시작값 100001로 설정)
        await queryRunner.query(`ALTER SEQUENCE "properties_property_number_seq" RESTART WITH 100001`);

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
                // 이미 존재하는지 확인
                const existing = await queryRunner.manager.findOne(Property, {
                    where: {
                        property_address_lot: data.property_address_lot,
                        property_lease_space: data.property_lease_space,
                    },
                });

                if (existing) {
                    console.log(`[SKIP] 이미 존재함: ${data.property_address_lot}, ${data.property_lease_space}`);
                    continue; // 다음 데이터로 넘어감
                }

                // 존재하지 않으면 새로 생성
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
