import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEsiContributionRateToPfSettings1781536000000 implements MigrationInterface {
    name = 'AddEsiContributionRateToPfSettings1781536000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" ADD COLUMN "esi_contribution_rate" numeric(5,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" DROP COLUMN "esi_contribution_rate"`);
    }

}
