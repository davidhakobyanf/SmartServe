import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddListingIndexes1788930000000 implements MigrationInterface {
  name = 'AddListingIndexes1788930000000';
  async up(runner: QueryRunner): Promise<void> {
    await runner.query('CREATE INDEX "IDX_products_category_page" ON "products" ("categoryId", "id")');
    await runner.query('CREATE INDEX "IDX_products_created_page" ON "products" ("createdAt" DESC, "id")');
    await runner.query('CREATE INDEX "IDX_orders_status_page" ON "orders" ("status", "createdAt", "id")');
    await runner.query('CREATE INDEX "IDX_orders_session_page" ON "orders" ("sessionId", "createdAt" DESC, "id")');
    await runner.query('CREATE INDEX "IDX_users_created_page" ON "users" ("createdAt" DESC, "id")');
  }
  async down(runner: QueryRunner): Promise<void> {
    for (const name of ['IDX_users_created_page', 'IDX_orders_session_page', 'IDX_orders_status_page', 'IDX_products_created_page', 'IDX_products_category_page']) {
      await runner.query(`DROP INDEX "${name}"`);
    }
  }
}
