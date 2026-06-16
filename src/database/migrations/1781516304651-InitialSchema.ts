import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781516304651 implements MigrationInterface {
    name = 'InitialSchema1781516304651'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "reset_token" character varying, "reset_token_expires" TIMESTAMP, "role" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "employees" ("id" SERIAL NOT NULL, "employee_code" character varying NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, "department" character varying NOT NULL, "designation" character varying NOT NULL, "joining_date" date NOT NULL, "bank_name" character varying NOT NULL, "account_number" character varying NOT NULL, "ifsc" character varying NOT NULL, "tax_regime" character varying NOT NULL DEFAULT 'new', "active_status" boolean NOT NULL DEFAULT true, "pf_deduction" boolean NOT NULL DEFAULT false, "tax_deduction" boolean NOT NULL DEFAULT true, "relieving_date" date, "other_inputs" text, "no_of_days_present" integer NOT NULL DEFAULT '30', "deduction_absent" numeric(12,2) NOT NULL DEFAULT '0', "appraisal" numeric(12,2) NOT NULL DEFAULT '0', "appraisal_effective_date" date, "leave_encashment" numeric(12,2) NOT NULL DEFAULT '0', "late_arrival_deduction" numeric(12,2) NOT NULL DEFAULT '0', "damages_recovery" numeric(12,2) NOT NULL DEFAULT '0', "remarks" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_56162b5f24af743a154680684f5" UNIQUE ("employee_code"), CONSTRAINT "UQ_765bc1ac8967533a04c74a9f6af" UNIQUE ("email"), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "salary_structures" ("id" SERIAL NOT NULL, "employee_id" integer NOT NULL, "basic_salary" numeric(12,2) NOT NULL, "hra" numeric(12,2) NOT NULL, "special_allowance" numeric(12,2) NOT NULL, "other_allowance" numeric(12,2) NOT NULL, "gross_salary" numeric(12,2) NOT NULL, "ctc" numeric(12,2) NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "effective_from" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1800f745fd1ebe08981cd422acd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "non_payable_days" ("id" SERIAL NOT NULL, "employee_id" integer NOT NULL, "month" integer NOT NULL, "year" integer NOT NULL, "days" integer NOT NULL DEFAULT '0', "remarks" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_372696d6747c14d4fde4650a4eb" UNIQUE ("employee_id", "month", "year"), CONSTRAINT "PK_271c7565a33740da61c1f97eeff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pf_settings" ("id" SERIAL NOT NULL, "employee_contribution_rate" numeric(5,2) NOT NULL, "employer_contribution_rate" numeric(5,2) NOT NULL, "max_pf_cap" numeric(10,2) NOT NULL DEFAULT '1800', "effective_date" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dbfd0d83672034c075117e1a5b6" UNIQUE ("effective_date"), CONSTRAINT "PK_22f7c741211c1e99cbc99b9261c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tax_slabs" ("id" SERIAL NOT NULL, "financial_year" character varying NOT NULL, "from_amount" numeric(12,2) NOT NULL, "to_amount" numeric(12,2), "percentage" numeric(5,2) NOT NULL, "regime" character varying NOT NULL DEFAULT 'new', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9138b80c90b7096dbbd9b43d6aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "employee_advances" ("id" SERIAL NOT NULL, "employee_id" integer NOT NULL, "amount" numeric(12,2) NOT NULL, "date" date NOT NULL, "reason" text, "recovery_type" character varying(20) NOT NULL, "installment_amount" numeric(12,2), "total_recovered" numeric(12,2) NOT NULL DEFAULT '0', "remaining_amount" numeric(12,2) NOT NULL, "start_month" integer NOT NULL, "start_year" integer NOT NULL, "is_fully_recovered" boolean NOT NULL DEFAULT false, "is_advance_salary" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_67088453c94606fff3f287671a2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payrolls" ("id" SERIAL NOT NULL, "employee_id" integer NOT NULL, "month" integer NOT NULL, "year" integer NOT NULL, "gross_salary" numeric(12,2) NOT NULL, "non_payable_deduction" numeric(12,2) NOT NULL, "pf_deduction" numeric(12,2) NOT NULL, "tax_deduction" numeric(12,2) NOT NULL, "advance_recovery" numeric(12,2) NOT NULL, "net_salary" numeric(12,2) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'draft', "recoveries_json" json, "tax_breakdown_json" json, "generated_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fec3a6e31e833dfefa4d958b38f" UNIQUE ("employee_id", "month", "year"), CONSTRAINT "PK_4fc19dcf3522661435565b5ecf3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "amount" numeric(12,2) NOT NULL, "category" character varying NOT NULL, "frequency" character varying NOT NULL, "date" date NOT NULL, "startDate" date, "endDate" date, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "userId" integer NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "isRevoked" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "blacklisted_tokens" ("id" SERIAL NOT NULL, "token" text NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2b8c5de96ce5460b558e94f1505" UNIQUE ("token"), CONSTRAINT "PK_8fb1bc7333c3b9f249f9feaa55d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "salary_structures" ADD CONSTRAINT "FK_e77e23919f090442d593192aeb8" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "non_payable_days" ADD CONSTRAINT "FK_0e836d05064f3564d25c3ecc16a" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employee_advances" ADD CONSTRAINT "FK_a90096aef5ac32f28cae96ef252" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payrolls" ADD CONSTRAINT "FK_5145d894f823722a43ec3e1955e" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        await queryRunner.query(`ALTER TABLE "payrolls" DROP CONSTRAINT "FK_5145d894f823722a43ec3e1955e"`);
        await queryRunner.query(`ALTER TABLE "employee_advances" DROP CONSTRAINT "FK_a90096aef5ac32f28cae96ef252"`);
        await queryRunner.query(`ALTER TABLE "non_payable_days" DROP CONSTRAINT "FK_0e836d05064f3564d25c3ecc16a"`);
        await queryRunner.query(`ALTER TABLE "salary_structures" DROP CONSTRAINT "FK_e77e23919f090442d593192aeb8"`);
        await queryRunner.query(`DROP TABLE "blacklisted_tokens"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`DROP TABLE "payrolls"`);
        await queryRunner.query(`DROP TABLE "employee_advances"`);
        await queryRunner.query(`DROP TABLE "tax_slabs"`);
        await queryRunner.query(`DROP TABLE "pf_settings"`);
        await queryRunner.query(`DROP TABLE "non_payable_days"`);
        await queryRunner.query(`DROP TABLE "salary_structures"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
