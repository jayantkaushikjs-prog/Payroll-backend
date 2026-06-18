import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPfUanToEmployees1781532000000 implements MigrationInterface {
  name = 'AddPfUanToEmployees1781532000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "employees" ADD "pf_uan" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "pf_uan"`);
  }
}
