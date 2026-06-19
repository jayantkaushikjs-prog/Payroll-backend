import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfessionalTaxToPFSettings1781855506236 implements MigrationInterface {
    name = 'AddProfessionalTaxToPFSettings1781855506236'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" ADD "professional_tax" numeric(10,2) NOT NULL DEFAULT '200'`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "pf_deduction" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT '0.75'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT 0.75`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "pf_deduction" SET DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "pf_settings" DROP COLUMN "professional_tax"`);
    }

}
