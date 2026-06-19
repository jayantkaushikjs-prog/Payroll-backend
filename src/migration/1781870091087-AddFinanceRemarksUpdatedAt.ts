import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFinanceRemarksUpdatedAt1781870091087 implements MigrationInterface {
    name = 'AddFinanceRemarksUpdatedAt1781870091087'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT '0.75'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT 0.75`);
    }

}
