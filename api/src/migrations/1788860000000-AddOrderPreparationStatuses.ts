import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderPreparationStatuses1788860000000 implements MigrationInterface {
  name = "AddOrderPreparationStatuses1788860000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."order_status_enum" ADD VALUE IF NOT EXISTS 'preparing'`);
    await queryRunner.query(`ALTER TYPE "public"."order_status_enum" ADD VALUE IF NOT EXISTS 'ready'`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."order_status_enum" RENAME TO "order_status_enum_with_preparation"`);
    await queryRunner.query(`CREATE TYPE "public"."order_status_enum" AS ENUM ('placed', 'completed', 'cancelled')`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."order_status_enum" USING (CASE WHEN "status"::text IN ('preparing', 'ready') THEN 'placed' ELSE "status"::text END)::"public"."order_status_enum"`);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'placed'`);
    await queryRunner.query(`DROP TYPE "public"."order_status_enum_with_preparation"`);
  }
}
