import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHrPreviewReviews1781533000000 implements MigrationInterface {
  name = 'CreateHrPreviewReviews1781533000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "hr_preview_reviews" (
        "id" SERIAL NOT NULL,
        "month" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'undone',
        "finance_remarks" text,
        "hr_marked_done_at" TIMESTAMP,
        "hr_marked_undone_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_hr_preview_reviews_month" UNIQUE ("month"),
        CONSTRAINT "PK_hr_preview_reviews" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "hr_preview_reviews"`);
  }
}
