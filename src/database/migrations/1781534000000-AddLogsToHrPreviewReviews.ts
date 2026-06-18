import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLogsToHrPreviewReviews1781534000000 implements MigrationInterface {
  name = 'AddLogsToHrPreviewReviews1781534000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hr_preview_reviews" ADD "logs" json`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hr_preview_reviews" DROP COLUMN "logs"`);
  }
}
