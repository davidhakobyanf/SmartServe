import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContentTranslations1788550000000
  implements MigrationInterface
{
  name = "AddContentTranslations1788550000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tables" ADD "nameTranslations" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "nameTranslations" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "sauces" ADD "nameTranslations" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "titleTranslations" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD "descriptionTranslations" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD "nameTranslations" jsonb NOT NULL DEFAULT '{}'::jsonb`,
    );

    await queryRunner.query(
      `UPDATE "tables" SET "nameTranslations" = jsonb_build_object('en', "name") WHERE "name" IS NOT NULL AND btrim("name") <> ''`,
    );
    await queryRunner.query(
      `UPDATE "categories" SET "nameTranslations" = jsonb_build_object('en', "name")`,
    );
    await queryRunner.query(
      `UPDATE "sauces" SET "nameTranslations" = jsonb_build_object('en', "name")`,
    );
    await queryRunner.query(
      `UPDATE "products" SET "titleTranslations" = jsonb_build_object('en', "title")`,
    );
    await queryRunner.query(
      `UPDATE "products" SET "descriptionTranslations" = jsonb_build_object('en', "description") WHERE btrim("description") <> ''`,
    );
    await queryRunner.query(
      `UPDATE "roles" SET "nameTranslations" = jsonb_build_object('en', "name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" DROP COLUMN "nameTranslations"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "descriptionTranslations"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "titleTranslations"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sauces" DROP COLUMN "nameTranslations"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN "nameTranslations"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tables" DROP COLUMN "nameTranslations"`,
    );
  }
}
