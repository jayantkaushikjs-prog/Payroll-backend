import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAdvanceLogs1782214497407 implements MigrationInterface {
    name = 'CreateAdvanceLogs1782214497407'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "advance_logs" ("id" SERIAL NOT NULL, "employee_id" integer NOT NULL, "amount" numeric(12,2) NOT NULL, "borrowed_date" date NOT NULL, "tentative_return_date" date, "actual_return_date" date, "notes" text, "status" character varying(20) NOT NULL DEFAULT 'open', "amount_returned" numeric(12,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8c06f294316101db381a6119b10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT '0.75'`);
        await queryRunner.query(`ALTER TABLE "advance_logs" ADD CONSTRAINT "FK_e0cd8032407ad2f228295f20935" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "advance_logs" DROP CONSTRAINT "FK_e0cd8032407ad2f228295f20935"`);
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT 0.75`);
        await queryRunner.query(`DROP TABLE "advance_logs"`);
    }

}
