import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEsiDeductionToEmployees1781535000000 implements MigrationInterface {
  name = 'AddEsiDeductionToEmployees1781535000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "esi_deduction" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN IF EXISTS "esi_deduction"`);
  }
}
