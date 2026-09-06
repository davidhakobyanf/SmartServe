import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAvatars1788660000000 implements MigrationInterface {
  name = "AddUserAvatars1788660000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "avatarName" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "avatarMimeType" character varying(100)`,
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "avatarData" bytea`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatarData"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "avatarMimeType"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatarName"`);
  }
}
