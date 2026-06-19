import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFinanceRemarksUpdatedAtToHrPreviewReview1781869549134 implements MigrationInterface {
    name = 'AddFinanceRemarksUpdatedAtToHrPreviewReview1781869549134'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr_preview_reviews" ADD "finance_remarks_updated_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT '0.75'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT 0.75`);
        await queryRunner.query(`ALTER TABLE "hr_preview_reviews" DROP COLUMN "finance_remarks_updated_at"`);
    }

}
