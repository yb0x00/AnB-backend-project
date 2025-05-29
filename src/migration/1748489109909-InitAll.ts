import { MigrationInterface, QueryRunner } from "typeorm";

export class InitAll1748489109909 implements MigrationInterface {
    name = 'InitAll1748489109909'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "lessors" ("id" SERIAL NOT NULL, "userId" integer, CONSTRAINT "PK_9ea207ec8c61842e339bacc76c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "agencies" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "agency_id" SERIAL NOT NULL, "agency_name" character varying(100) NOT NULL, "agency_phone" character varying(20) NOT NULL, CONSTRAINT "PK_3edcd21dc752082978b909cd41c" PRIMARY KEY ("id", "agency_id"))`);
        await queryRunner.query(`CREATE TABLE "agents" ("id" SERIAL NOT NULL, "agent_license_number" character varying(30) NOT NULL, "userId" integer, "agencyId" integer, "agencyAgencyId" integer, CONSTRAINT "PK_9c653f28ae19c5884d5baf6a1d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."properties_property_status_enum" AS ENUM('available', 'contracted', 'terminated')`);
        await queryRunner.query(`CREATE TABLE "properties" ("property_id" SERIAL NOT NULL, "property_number" SERIAL NOT NULL, "property_status" "public"."properties_property_status_enum" NOT NULL DEFAULT 'available', "property_headline" character varying(100) NOT NULL, "property_address_lot" character varying(255) NOT NULL, "property_building_usage" character varying(50) NOT NULL, "property_lease_space" character varying(100) NOT NULL, "contract_lease_area" double precision NOT NULL, "property_lease_type" character varying(20) NOT NULL, "property_deposit_price" bigint NOT NULL, "property_monthly_rent_price" bigint NOT NULL, "lessorId" integer, "agentId" integer, CONSTRAINT "UQ_d007bf85f0709b85fc29bc9b6e3" UNIQUE ("property_address_lot", "property_lease_space"), CONSTRAINT "PK_b3fea131924b6a50785b0f4ce6d" PRIMARY KEY ("property_id"))`);
        await queryRunner.query(`CREATE TABLE "signatures" ("signature_id" SERIAL NOT NULL, "signature_value" character varying(512) NOT NULL, "signed_at" TIMESTAMP NOT NULL DEFAULT now(), "contractContractId" integer, "userId" integer, CONSTRAINT "PK_99e02b7c4f06e3e36e6a0cd5a27" PRIMARY KEY ("signature_id"))`);
        await queryRunner.query(`CREATE TABLE "payments" ("payment_id" SERIAL NOT NULL, "payment_type" character varying(20) NOT NULL, "payment_amount" bigint NOT NULL, "payment_due_date" date NOT NULL, "payment_actual_date" date, "payment_method" character varying(30) NOT NULL, "pg_token" character varying, "payment_status" character varying(20) NOT NULL, "payment_hash" character varying(255) NOT NULL, "payment_blockchain_tx_hash" character varying(255) NOT NULL, "payment_blockchain_status" character varying(20) NOT NULL, "payment_created_at" TIMESTAMP NOT NULL DEFAULT now(), "contractContractId" integer, CONSTRAINT "PK_8866a3cfff96b8e17c2b204aae0" PRIMARY KEY ("payment_id"))`);
        await queryRunner.query(`CREATE TABLE "contracts" ("contract_id" SERIAL NOT NULL, "contract_status" character varying(20) NOT NULL, "contract_created_at" TIMESTAMP NOT NULL DEFAULT now(), "contract_expired_at" TIMESTAMP, "contract_termination_reason" character varying(50), "contract_hash" character varying(255) NOT NULL, "contract_address" character varying(42) NOT NULL, "contract_blockchain_tx_hash" character varying(255) NOT NULL, "contract_blockchain_status" character varying(20) NOT NULL, "propertyPropertyId" integer, "lesseeId" integer NOT NULL, "lessorId" integer, "agentId" integer, "previousContractContractId" integer, CONSTRAINT "PK_d4c091e72433a7125d9158170e7" PRIMARY KEY ("contract_id"))`);
        await queryRunner.query(`CREATE TABLE "lessees" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_a71d5585c80858ce6d16256a66c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_name" character varying(100) NOT NULL, "login_id" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "wallet_address" character(42) NOT NULL, "phone" character varying(20), "resident_registration_number" character varying(255), CONSTRAINT "UQ_e564194a9a22f8c623354284f75" UNIQUE ("login_id"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contracts_details" ("contract_id" SERIAL NOT NULL, "contract_property_location" character varying(255) NOT NULL, "contract_land_category" character varying(50) NOT NULL, "contract_land_area" double precision NOT NULL, "contract_building_structure" character varying(100) NOT NULL, "contract_building_usage" character varying(50) NOT NULL, "contract_building_area" double precision NOT NULL, "contract_lease_space" character varying(100) NOT NULL, "contract_lease_area" double precision NOT NULL, "contract_deposit_amount" bigint NOT NULL, "contract_deposit_korean" character varying(255) NOT NULL, "contract_down_payment" bigint NOT NULL, "contract_intermediate_payment" bigint NOT NULL, "contract_intermediate_payment_date" date NOT NULL, "contract_balance_payment" bigint NOT NULL, "contract_balance_payment_date" date NOT NULL, "contract_monthly_rent" bigint NOT NULL, "contract_rent_payment_date" date NOT NULL, "contract_lease_start_date" date NOT NULL, "contract_lease_end_date" date NOT NULL, "special_terms" text, CONSTRAINT "PK_7d466cf69b535a6d1556fb1a19f" PRIMARY KEY ("contract_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_notification_type_enum" AS ENUM('CONTRACT_REQUEST', 'CONTRACT_CREATION_REQUEST')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("notification_id" SERIAL NOT NULL, "notification_type" "public"."notifications_notification_type_enum" NOT NULL, "notification_message" character varying(255) NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "contractContractId" integer, "paymentPaymentId" integer, "userId" integer, CONSTRAINT "PK_eaedfe19f0f765d26afafa85956" PRIMARY KEY ("notification_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."contract_requests_status_enum" AS ENUM('PENDING', 'LESSOR_ACCEPTED', 'AGENT_ACCEPTED', 'ALL_ACCEPTED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "contract_requests" ("id" SERIAL NOT NULL, "status" "public"."contract_requests_status_enum" NOT NULL DEFAULT 'PENDING', "lessorAccepted" boolean NOT NULL DEFAULT false, "agentAccepted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "propertyPropertyId" integer NOT NULL, "lesseeId" integer NOT NULL, CONSTRAINT "PK_74f2498ebadff8d03b0eee19617" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "lessors" ADD CONSTRAINT "FK_9734b9a557057f4f9d1c1a0d852" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agents" ADD CONSTRAINT "FK_f535e5b2c0f0dc7b7fc656ebc91" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agents" ADD CONSTRAINT "FK_30b82bbf210490c496b0e74ce02" FOREIGN KEY ("agencyId", "agencyAgencyId") REFERENCES "agencies"("id","agency_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_267da0a5a2f4d92abb5399278d0" FOREIGN KEY ("lessorId") REFERENCES "lessors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_353db6091069783cf1673cc82f6" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "signatures" ADD CONSTRAINT "FK_ea88035e5575e36077600f4d31e" FOREIGN KEY ("contractContractId") REFERENCES "contracts"("contract_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "signatures" ADD CONSTRAINT "FK_d03d5b61e9fc2ee9a6cfa898cc5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_6d2c83a45f381c2eb65547b8b5d" FOREIGN KEY ("contractContractId") REFERENCES "contracts"("contract_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_7b896d546abaeab5d0c6581165b" FOREIGN KEY ("propertyPropertyId") REFERENCES "properties"("property_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_961eea0326750704b102b85ce69" FOREIGN KEY ("lesseeId") REFERENCES "lessees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_408e24716d4f749670c7d0ef4ed" FOREIGN KEY ("lessorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_e035952379293586b00e1149da7" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "FK_07b72eca569bfd79f7791419199" FOREIGN KEY ("previousContractContractId") REFERENCES "contracts"("contract_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lessees" ADD CONSTRAINT "FK_43eeb8c5799684dbde18fffbac6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contracts_details" ADD CONSTRAINT "FK_7d466cf69b535a6d1556fb1a19f" FOREIGN KEY ("contract_id") REFERENCES "contracts"("contract_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_49fc5656e87f63a5f587c84d934" FOREIGN KEY ("contractContractId") REFERENCES "contracts"("contract_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_99f02e20cb266d80c9ad1e86cef" FOREIGN KEY ("paymentPaymentId") REFERENCES "payments"("payment_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contract_requests" ADD CONSTRAINT "FK_6caf2b97e56fb94a04885537d32" FOREIGN KEY ("propertyPropertyId") REFERENCES "properties"("property_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contract_requests" ADD CONSTRAINT "FK_4afaf35d60233dd4d4f62b389dd" FOREIGN KEY ("lesseeId") REFERENCES "lessees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contract_requests" DROP CONSTRAINT "FK_4afaf35d60233dd4d4f62b389dd"`);
        await queryRunner.query(`ALTER TABLE "contract_requests" DROP CONSTRAINT "FK_6caf2b97e56fb94a04885537d32"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_99f02e20cb266d80c9ad1e86cef"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_49fc5656e87f63a5f587c84d934"`);
        await queryRunner.query(`ALTER TABLE "contracts_details" DROP CONSTRAINT "FK_7d466cf69b535a6d1556fb1a19f"`);
        await queryRunner.query(`ALTER TABLE "lessees" DROP CONSTRAINT "FK_43eeb8c5799684dbde18fffbac6"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_07b72eca569bfd79f7791419199"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_e035952379293586b00e1149da7"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_408e24716d4f749670c7d0ef4ed"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_961eea0326750704b102b85ce69"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "FK_7b896d546abaeab5d0c6581165b"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_6d2c83a45f381c2eb65547b8b5d"`);
        await queryRunner.query(`ALTER TABLE "signatures" DROP CONSTRAINT "FK_d03d5b61e9fc2ee9a6cfa898cc5"`);
        await queryRunner.query(`ALTER TABLE "signatures" DROP CONSTRAINT "FK_ea88035e5575e36077600f4d31e"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_353db6091069783cf1673cc82f6"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_267da0a5a2f4d92abb5399278d0"`);
        await queryRunner.query(`ALTER TABLE "agents" DROP CONSTRAINT "FK_30b82bbf210490c496b0e74ce02"`);
        await queryRunner.query(`ALTER TABLE "agents" DROP CONSTRAINT "FK_f535e5b2c0f0dc7b7fc656ebc91"`);
        await queryRunner.query(`ALTER TABLE "lessors" DROP CONSTRAINT "FK_9734b9a557057f4f9d1c1a0d852"`);
        await queryRunner.query(`DROP TABLE "contract_requests"`);
        await queryRunner.query(`DROP TYPE "public"."contract_requests_status_enum"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_notification_type_enum"`);
        await queryRunner.query(`DROP TABLE "contracts_details"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "lessees"`);
        await queryRunner.query(`DROP TABLE "contracts"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "signatures"`);
        await queryRunner.query(`DROP TABLE "properties"`);
        await queryRunner.query(`DROP TYPE "public"."properties_property_status_enum"`);
        await queryRunner.query(`DROP TABLE "agents"`);
        await queryRunner.query(`DROP TABLE "agencies"`);
        await queryRunner.query(`DROP TABLE "lessors"`);
    }

}
