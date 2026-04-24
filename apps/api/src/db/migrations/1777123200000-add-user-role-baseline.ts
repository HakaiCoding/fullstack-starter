import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleBaseline1777123200000 implements MigrationInterface {
  name = 'AddUserRoleBaseline1777123200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "role" text
    `);
    await queryRunner.query(`
      UPDATE "users"
      SET "role" = 'user'
      WHERE "role" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" SET DEFAULT 'user'
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "CHK_users_role_allowed"
      CHECK ("role" IN ('admin', 'user'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP CONSTRAINT "CHK_users_role_allowed"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "role"
    `);
  }
}
