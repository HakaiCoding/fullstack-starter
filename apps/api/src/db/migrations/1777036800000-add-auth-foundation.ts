import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthFoundation1777036800000 implements MigrationInterface {
  name = 'AddAuthFoundation1777036800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "password_hash" text
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "CHK_users_password_hash_not_blank"
      CHECK ("password_hash" IS NULL OR btrim("password_hash") <> '')
    `);

    await queryRunner.query(`
      CREATE TABLE "auth_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "refresh_token_hash" text NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMPTZ NOT NULL,
        "revoked_at" TIMESTAMPTZ,
        CONSTRAINT "PK_auth_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_auth_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "UQ_auth_sessions_user_id" UNIQUE ("user_id"),
        CONSTRAINT "UQ_auth_sessions_refresh_token_hash" UNIQUE ("refresh_token_hash"),
        CONSTRAINT "CHK_auth_sessions_refresh_token_hash_not_blank" CHECK (btrim("refresh_token_hash") <> ''),
        CONSTRAINT "CHK_auth_sessions_expiry_after_creation" CHECK ("expires_at" > "created_at"),
        CONSTRAINT "CHK_auth_sessions_revoked_at_after_creation" CHECK ("revoked_at" IS NULL OR "revoked_at" >= "created_at")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_auth_sessions_expires_at" ON "auth_sessions" ("expires_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_auth_sessions_revoked_at" ON "auth_sessions" ("revoked_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."idx_auth_sessions_revoked_at"
    `);
    await queryRunner.query(`
      DROP INDEX "public"."idx_auth_sessions_expires_at"
    `);
    await queryRunner.query(`
      DROP TABLE "auth_sessions"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP CONSTRAINT "CHK_users_password_hash_not_blank"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "password_hash"
    `);
  }
}
