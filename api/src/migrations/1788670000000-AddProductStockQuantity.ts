import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductStockQuantity1788670000000
  implements MigrationInterface
{
  name = "AddProductStockQuantity1788670000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "stockQuantity" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "CHK_products_stock_quantity" CHECK ("stockQuantity" IS NULL OR "stockQuantity" >= 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "CHK_products_stock_quantity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "stockQuantity"`,
    );
  }
}
