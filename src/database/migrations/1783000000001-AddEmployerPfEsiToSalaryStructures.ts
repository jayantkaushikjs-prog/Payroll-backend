import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployerPfEsiToSalaryStructures1783000000001 implements MigrationInterface {
  name = 'AddEmployerPfEsiToSalaryStructures1783000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "salary_structures" ADD "employer_pf" numeric(12,2) NOT NULL DEFAULT '0'`);
    await queryRunner.query(`ALTER TABLE "salary_structures" ADD "employer_esi" numeric(12,2) NOT NULL DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "salary_structures" DROP COLUMN "employer_esi"`);
    await queryRunner.query(`ALTER TABLE "salary_structures" DROP COLUMN "employer_pf"`);
  }
}
