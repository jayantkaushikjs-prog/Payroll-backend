import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameBenefitTypeToContributionType1781538000000 implements MigrationInterface {
    name = 'RenameBenefitTypeToContributionType1781538000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" RENAME COLUMN "pf_benefit_type" TO "pf_contribution_type"`);
        await queryRunner.query(`ALTER TABLE "pf_settings" RENAME COLUMN "esi_benefit_type" TO "esi_contribution_type"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" RENAME COLUMN "pf_contribution_type" TO "pf_benefit_type"`);
        await queryRunner.query(`ALTER TABLE "pf_settings" RENAME COLUMN "esi_contribution_type" TO "esi_benefit_type"`);
    }

}
