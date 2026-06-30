import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeNoOfDaysPresentNullable1782816819861 implements MigrationInterface {
    name = 'MakeNoOfDaysPresentNullable1782816819861'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "no_of_days_present" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "no_of_days_present" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT '0.75'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT 0.75`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "no_of_days_present" SET DEFAULT '30'`);
        await queryRunner.query(`ALTER TABLE "employees" ALTER COLUMN "no_of_days_present" SET NOT NULL`);
    }

}
