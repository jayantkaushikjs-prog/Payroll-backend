import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdvanceLogTable1782213872624 implements MigrationInterface {
    name = 'AddAdvanceLogTable1782213872624'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT '0.75'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT 0.75`);
    }

}
