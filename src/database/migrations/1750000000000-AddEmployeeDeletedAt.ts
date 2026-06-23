import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeDeletedAt1750000000000 implements MigrationInterface {
  name = 'AddEmployeeDeletedAt1750000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ DEFAULT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN IF EXISTS "deleted_at"`);
  }
}
