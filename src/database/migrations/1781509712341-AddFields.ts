import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFields1781509712341 implements MigrationInterface {
    name = 'AddFields1781509712341'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employee_advances" ADD COLUMN IF NOT EXISTS "is_advance_salary" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "appraisal_effective_date" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Safe drop checks
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN IF EXISTS "appraisal_effective_date"`);
        await queryRunner.query(`ALTER TABLE "employee_advances" DROP COLUMN IF EXISTS "is_advance_salary"`);
    }
}
