import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPersonalEmailToEmployee1782822197433 implements MigrationInterface {
    name = 'AddPersonalEmailToEmployee1782822197433'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" ADD "personal_email" character varying`);
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT '0.75'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT 0.75`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "personal_email"`);
    }

}
