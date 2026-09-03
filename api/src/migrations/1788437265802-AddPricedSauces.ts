import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPricedSauces1788437265802 implements MigrationInterface {
    name = 'AddPricedSauces1788437265802'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sauces" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "price" numeric(10,2) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fb8709a2f803cdf48a1987f933f" UNIQUE ("name"), CONSTRAINT "PK_782d0a478f4cbea6fbc52d01032" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_sauces" ("productId" uuid NOT NULL, "sauceId" uuid NOT NULL, CONSTRAINT "PK_7cce493e9f7ca2bd7601b4e247e" PRIMARY KEY ("productId", "sauceId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_product_sauces_sauceId" ON "product_sauces" ("sauceId") `);
        await queryRunner.query(`
          WITH legacy_sauce_names AS (
            SELECT btrim(value #>> '{}') AS name
            FROM "products", jsonb_array_elements("products"."sauces") AS value
            UNION
            SELECT btrim(value #>> '{}') AS name
            FROM "basket_items", jsonb_array_elements("basket_items"."sauces") AS value
            UNION
            SELECT btrim(value #>> '{}') AS name
            FROM "order_items", jsonb_array_elements("order_items"."sauces") AS value
          )
          INSERT INTO "sauces" ("name", "price")
          SELECT DISTINCT
            name,
            COALESCE(
              (SELECT "sauceUnitPrice" FROM "venue_settings" WHERE "id" = 1),
              350
            )
          FROM legacy_sauce_names
          WHERE name <> ''
          ON CONFLICT ("name") DO NOTHING
        `);
        await queryRunner.query(`
          INSERT INTO "product_sauces" ("productId", "sauceId")
          SELECT "products"."id", "sauces"."id"
          FROM "products"
          CROSS JOIN LATERAL jsonb_array_elements("products"."sauces") AS value
          INNER JOIN "sauces" ON "sauces"."name" = btrim(value #>> '{}')
          ON CONFLICT DO NOTHING
        `);
        await queryRunner.query(`
          UPDATE "basket_items" AS basket
          SET "sauces" = COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', "sauces"."id",
                  'name', "sauces"."name",
                  'unitPrice', "sauces"."price"
                )
                ORDER BY "sauces"."name"
              )
              FROM jsonb_array_elements(basket."sauces") AS value
              INNER JOIN "sauces" ON "sauces"."name" = btrim(value #>> '{}')
            ),
            '[]'::jsonb
          )
        `);
        await queryRunner.query(`
          UPDATE "order_items" AS order_item
          SET "sauces" = COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', "sauces"."id",
                  'name', "sauces"."name",
                  'unitPrice', "sauces"."price"
                )
                ORDER BY "sauces"."name"
              )
              FROM jsonb_array_elements(order_item."sauces") AS value
              INNER JOIN "sauces" ON "sauces"."name" = btrim(value #>> '{}')
            ),
            '[]'::jsonb
          )
        `);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "sauces"`);
        await queryRunner.query(`ALTER TABLE "venue_settings" DROP COLUMN "sauceUnitPrice"`);
        await queryRunner.query(`ALTER TABLE "product_sauces" ADD CONSTRAINT "FK_81c628d0d726162a51261d33933" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_sauces" ADD CONSTRAINT "FK_1acf21024f2e979f6f4fdbe017c" FOREIGN KEY ("sauceId") REFERENCES "sauces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_sauces" DROP CONSTRAINT "FK_1acf21024f2e979f6f4fdbe017c"`);
        await queryRunner.query(`ALTER TABLE "product_sauces" DROP CONSTRAINT "FK_81c628d0d726162a51261d33933"`);
        await queryRunner.query(`ALTER TABLE "venue_settings" ADD "sauceUnitPrice" numeric(10,2) NOT NULL DEFAULT '350'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "sauces" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`
          UPDATE "products" AS product
          SET "sauces" = COALESCE(
            (
              SELECT jsonb_agg("sauces"."name" ORDER BY "sauces"."name")
              FROM "product_sauces"
              INNER JOIN "sauces" ON "sauces"."id" = "product_sauces"."sauceId"
              WHERE "product_sauces"."productId" = product."id"
            ),
            '[]'::jsonb
          )
        `);
        await queryRunner.query(`
          UPDATE "basket_items" AS basket
          SET "sauces" = COALESCE(
            (
              SELECT jsonb_agg(value->>'name')
              FROM jsonb_array_elements(basket."sauces") AS value
            ),
            '[]'::jsonb
          )
        `);
        await queryRunner.query(`
          UPDATE "order_items" AS order_item
          SET "sauces" = COALESCE(
            (
              SELECT jsonb_agg(value->>'name')
              FROM jsonb_array_elements(order_item."sauces") AS value
            ),
            '[]'::jsonb
          )
        `);
        await queryRunner.query(`DROP INDEX "public"."IDX_product_sauces_sauceId"`);
        await queryRunner.query(`DROP TABLE "product_sauces"`);
        await queryRunner.query(`DROP TABLE "sauces"`);
    }

}
