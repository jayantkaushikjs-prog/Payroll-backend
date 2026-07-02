import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMonthlyEmployeeInput1782993449464 implements MigrationInterface {
    name = 'AddMonthlyEmployeeInput1782993449464'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "monthly_employee_inputs" ("id" SERIAL NOT NULL, "employee_id" integer NOT NULL, "month" character varying(7) NOT NULL, "no_of_days_present" integer, "deduction_absent" numeric(12,2) NOT NULL DEFAULT '0', "leave_encashment" numeric(12,2) NOT NULL DEFAULT '0', "late_arrival_deduction" numeric(12,2) NOT NULL DEFAULT '0', "damages_recovery" numeric(12,2) NOT NULL DEFAULT '0', "bonus_incentives" numeric(12,2) NOT NULL DEFAULT '0', "other_deductions" numeric(12,2) NOT NULL DEFAULT '0', "remarks" text, "other_inputs" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5ed7eb8c8201b003c34fab399c1" UNIQUE ("employee_id", "month"), CONSTRAINT "PK_4c24776812fa92ba0e375090fc7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT '0.75'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pf_settings" ALTER COLUMN "esi_employee_contribution_rate" SET DEFAULT 0.75`);
        await queryRunner.query(`DROP TABLE "monthly_employee_inputs"`);
    }

}
