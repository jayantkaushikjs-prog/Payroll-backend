import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBonusAndOtherDeductions1781530000000 implements MigrationInterface {
    name = 'AddBonusAndOtherDeductions1781530000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "bonus_incentives" NUMERIC(12,2) NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "other_deductions" NUMERIC(12,2) NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN IF EXISTS "other_deductions"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN IF EXISTS "bonus_incentives"`);
    }
}
