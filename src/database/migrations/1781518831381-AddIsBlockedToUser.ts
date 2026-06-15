import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsBlockedToUser1781518831381 implements MigrationInterface {
    name = 'AddIsBlockedToUser1781518831381'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_blocked" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_blocked"`);
    }

}
