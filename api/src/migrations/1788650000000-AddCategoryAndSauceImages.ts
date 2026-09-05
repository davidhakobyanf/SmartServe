import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryAndSauceImages1788650000000
  implements MigrationInterface
{
  name = "AddCategoryAndSauceImages1788650000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "imageName" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "imageMimeType" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "imageData" bytea`,
    );
    await queryRunner.query(
      `ALTER TABLE "sauces" ADD "imageName" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sauces" ADD "imageMimeType" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sauces" ADD "imageData" bytea`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sauces" DROP COLUMN "imageData"`);
    await queryRunner.query(
      `ALTER TABLE "sauces" DROP COLUMN "imageMimeType"`,
    );
    await queryRunner.query(`ALTER TABLE "sauces" DROP COLUMN "imageName"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "imageData"`);
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN "imageMimeType"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN "imageName"`,
    );
  }
}
