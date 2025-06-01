import * as fs from "fs/promises";
import * as path from "path";
import {Property} from "@/entities/Property";
import {PropertyStatus} from "@/enums/PropertyStatus";
import {Agent} from "@/entities/Agent";
import {Lessor} from "@/entities/Lessor";
import {AppDataSource} from "@/data-source";

export const seedProperties = async () => {
    const filePath = path.resolve(__dirname, "properties_seed.json");

    try {
        // 1. JSON 파일 읽기 및 파싱
        const raw = await fs.readFile(filePath, "utf-8");
        const propertyDataList = JSON.parse(raw);

        if (!Array.isArray(propertyDataList)) {
            throw new Error("Seed 파일의 데이터 형식이 배열이 아닙니다.");
        }

        // 2. 트랜잭션 시작
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 3. 시퀀스 초기화
            await queryRunner.query(`ALTER SEQUENCE "properties_property_number_seq" RESTART WITH 100001`);

            // 4. 매물 시딩 루프
            for (const data of propertyDataList) {
                const agent = await queryRunner.manager
                    .createQueryBuilder(Agent, "agent")
                    .leftJoinAndSelect("agent.user", "user")
                    .where("user.email = :email", {email: data.agent_email})
                    .getOne();

                const lessor = await queryRunner.manager
                    .createQueryBuilder(Lessor, "lessor")
                    .leftJoinAndSelect("lessor.user", "user")
                    .where("user.email = :email", {email: data.lessor_email})
                    .getOne();

                if (!agent || !lessor) {
                    console.warn(`[SKIP] agent 또는 lessor를 찾을 수 없음. ${data.agent_email}, ${data.lessor_email}`);
                    continue;
                }

                const existing = await queryRunner.manager.findOne(Property, {
                    where: {
                        property_address_lot: data.property_address_lot,
                        property_lease_space: data.property_lease_space,
                    },
                });

                if (existing) {
                    console.log(`[SKIP] 이미 존재함: ${data.property_address_lot}, ${data.property_lease_space}`);
                    continue;
                }

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
            throw err;
        } finally {
            await queryRunner.release();
        }
    } catch (err) {
        console.error("시딩 파일 로딩 또는 초기화 오류:", err);
    }
};

// 직접 실행될 경우
if (require.main === module) {
    seedProperties()
        .then(() => {
            console.log("seedProperties 실행 완료");
            process.exit(0);
        })
        .catch((err) => {
            console.error("seedProperties 실행 실패:", err);
            process.exit(1);
        });
}
