import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAppraisalToMonthlyEmployeeInput1783000000000 implements MigrationInterface {
    name = 'AddAppraisalToMonthlyEmployeeInput1783000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monthly_employee_inputs" ADD COLUMN "appraisal" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "monthly_employee_inputs" ADD COLUMN "appraisal_effective_date" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "monthly_employee_inputs" DROP COLUMN "appraisal_effective_date"`);
        await queryRunner.query(`ALTER TABLE "monthly_employee_inputs" DROP COLUMN "appraisal"`);
    }
}
