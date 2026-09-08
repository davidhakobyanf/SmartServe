import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderItemTranslations1788850000000 implements MigrationInterface {
  name = "AddOrderItemTranslations1788850000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_items"
      ADD "titleTranslationsSnapshot" jsonb NOT NULL DEFAULT '{}'::jsonb,
      ADD "descriptionTranslationsSnapshot" jsonb NOT NULL DEFAULT '{}'::jsonb
    `);

    // Recover available translations for old orders while retaining their
    // original English text, including orders whose product was deleted.
    await queryRunner.query(`
      UPDATE "order_items" AS item
      SET "titleTranslationsSnapshot" = COALESCE(
        (SELECT product."titleTranslations" FROM "products" AS product
         WHERE product."id" = item."productId"), '{}'::jsonb
      ) || jsonb_build_object('en', item."titleSnapshot"),
      "descriptionTranslationsSnapshot" = COALESCE(
        (SELECT product."descriptionTranslations" FROM "products" AS product
         WHERE product."id" = item."productId"), '{}'::jsonb
      ) || jsonb_build_object('en', item."descriptionSnapshot")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_items"
      DROP COLUMN "descriptionTranslationsSnapshot",
      DROP COLUMN "titleTranslationsSnapshot"
    `);
  }
}
