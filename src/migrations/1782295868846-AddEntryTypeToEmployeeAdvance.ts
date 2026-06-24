import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEntryTypeToEmployeeAdvance1782295868846 implements MigrationInterface {
    name = 'AddEntryTypeToEmployeeAdvance1782295868846'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'employee_advances' AND column_name = 'entry_type'
            ) as exists
        `);

        if (!columnExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "employee_advances" ADD "entry_type" character varying(20) NOT NULL DEFAULT 'manual'`);
        }

        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT '0.75'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT 0.75`);

        const columnExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'employee_advances' AND column_name = 'entry_type'
            ) as exists
        `);

        if (columnExists[0].exists) {
            await queryRunner.query(`ALTER TABLE "employee_advances" DROP COLUMN "entry_type"`);
        }
    }

}
