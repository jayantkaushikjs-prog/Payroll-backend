import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCtcToEmployees1781531000000 implements MigrationInterface {
    name = 'AddCtcToEmployees1781531000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "monthly_ctc" NUMERIC(14,2) NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "annual_ctc" NUMERIC(14,2) NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN IF EXISTS "annual_ctc"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN IF EXISTS "monthly_ctc"`);
    }
}
