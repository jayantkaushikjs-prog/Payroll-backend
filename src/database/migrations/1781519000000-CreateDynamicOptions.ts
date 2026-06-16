import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDynamicOptions1781519000000 implements MigrationInterface {
    name = 'CreateDynamicOptions1781519000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create departments table
        await queryRunner.query(`CREATE TABLE "departments" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_department_name" UNIQUE ("name"), CONSTRAINT "PK_departments" PRIMARY KEY ("id"))`);
        
        // Create designations table
        await queryRunner.query(`CREATE TABLE "designations" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_designation_name" UNIQUE ("name"), CONSTRAINT "PK_designations" PRIMARY KEY ("id"))`);

        // Create expense_categories table
        await queryRunner.query(`CREATE TABLE "expense_categories" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_expense_category_name" UNIQUE ("name"), CONSTRAINT "PK_expense_categories" PRIMARY KEY ("id"))`);

        // Seed default departments
        await queryRunner.query(`INSERT INTO "departments" ("name") VALUES 
            ('Human Resources (HR)'),
            ('Finance & Accounts'),
            ('Information Technology (IT)'),
            ('Operations'),
            ('Sales'),
            ('Marketing'),
            ('Customer Support'),
            ('Administration'),
            ('Legal'),
            ('Procurement')
            ON CONFLICT DO NOTHING`);

        // Seed default designations
        await queryRunner.query(`INSERT INTO "designations" ("name") VALUES 
            ('Intern'),
            ('Trainee'),
            ('Associate'),
            ('Executive'),
            ('Senior Executive'),
            ('Team Lead'),
            ('Assistant Manager'),
            ('Manager'),
            ('Senior Manager'),
            ('Director')
            ON CONFLICT DO NOTHING`);

        // Seed default expense categories
        await queryRunner.query(`INSERT INTO "expense_categories" ("name") VALUES 
            ('rent'),
            ('salary'),
            ('pf'),
            ('utilities'),
            ('marketing'),
            ('one-time'),
            ('other')
            ON CONFLICT DO NOTHING`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "expense_categories"`);
        await queryRunner.query(`DROP TABLE "designations"`);
        await queryRunner.query(`DROP TABLE "departments"`);
    }
}
