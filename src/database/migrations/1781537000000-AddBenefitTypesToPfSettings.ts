import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBenefitTypesToPfSettings1781537000000 implements MigrationInterface {
    name = 'AddBenefitTypesToPfSettings1781537000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" ADD COLUMN "esi_employee_contribution_rate" numeric(5,2) NOT NULL DEFAULT '0.75'`);
        await queryRunner.query(`ALTER TABLE "pf_settings" ADD COLUMN "pf_benefit_type" integer NOT NULL DEFAULT '2'`);
        await queryRunner.query(`ALTER TABLE "pf_settings" ADD COLUMN "esi_benefit_type" integer NOT NULL DEFAULT '2'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" DROP COLUMN "esi_benefit_type"`);
        await queryRunner.query(`ALTER TABLE "pf_settings" DROP COLUMN "pf_benefit_type"`);
        await queryRunner.query(`ALTER TABLE "pf_settings" DROP COLUMN "esi_employee_contribution_rate"`);
    }

}
