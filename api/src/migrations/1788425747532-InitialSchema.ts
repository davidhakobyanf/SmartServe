import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1788425747532 implements MigrationInterface {
    name = 'InitialSchema1788425747532'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "sortOrder" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "categoryId" uuid NOT NULL, "title" character varying(160) NOT NULL, "description" text NOT NULL DEFAULT '', "price" numeric(10,2) NOT NULL, "sauces" jsonb NOT NULL DEFAULT '[]', "isActive" boolean NOT NULL DEFAULT true, "imageName" character varying(255), "imageMimeType" character varying(100), "imageData" bytea, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "orderId" uuid NOT NULL, "productId" uuid, "titleSnapshot" character varying(160) NOT NULL, "descriptionSnapshot" text NOT NULL DEFAULT '', "unitPrice" numeric(10,2) NOT NULL, "quantity" integer NOT NULL, "sauces" jsonb NOT NULL DEFAULT '[]', "lineTotal" numeric(12,2) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_6e5d794f7711186091b3156024" CHECK ("quantity" > 0), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f1d359a55923bb45b057fbdab0" ON "order_items" ("orderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cdb99c05982d5191ac8465ac01" ON "order_items" ("productId") `);
        await queryRunner.query(`CREATE TYPE "public"."order_status_enum" AS ENUM('placed', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tableId" uuid NOT NULL, "sessionId" uuid NOT NULL, "status" "public"."order_status_enum" NOT NULL DEFAULT 'placed', "total" numeric(12,2) NOT NULL, "completedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2a7fdd7af437285a3ef0fc8b64" ON "orders" ("tableId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d1c3294f3925bb9d31512067e5" ON "orders" ("sessionId") `);
        await queryRunner.query(`CREATE TABLE "tables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "number" integer NOT NULL, "name" character varying(100), "publicToken" uuid NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_0aa8f1290718849823b581ec144" UNIQUE ("number"), CONSTRAINT "UQ_a4cee013d3134813f66841bf869" UNIQUE ("publicToken"), CONSTRAINT "PK_7cf2aca7af9550742f855d4eb69" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "dining_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tableId" uuid NOT NULL, "status" character varying NOT NULL DEFAULT 'open', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "closedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_7b9592d6e116355f21fd8ea1f25" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_143bcb934c483e3bb7e5955c3c" ON "dining_sessions" ("tableId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_open_session_per_table" ON "dining_sessions" ("tableId") WHERE "status" = 'open'`);
        await queryRunner.query(`CREATE TABLE "basket_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionId" uuid NOT NULL, "productId" uuid NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "sauces" jsonb NOT NULL DEFAULT '[]', "unitPrice" numeric(10,2) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_d269a332ea416099cb98821137" CHECK ("quantity" > 0), CONSTRAINT "PK_9c916f29c8b703688fd4b1717c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0ec0a550b8a734addaf082a194" ON "basket_items" ("sessionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_bca53dec99316713d968c6a214" ON "basket_items" ("productId") `);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "code" character varying(50) NOT NULL, "permissions" jsonb NOT NULL DEFAULT '[]', "isSystem" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f6d54f95c31b73fb1bdd8e91d0c" UNIQUE ("code"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_status_enum" AS ENUM('pending', 'active', 'rejected', 'disabled')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "surname" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "roleId" uuid, "status" "public"."user_status_enum" NOT NULL DEFAULT 'pending', "permissionAllow" jsonb NOT NULL DEFAULT '[]', "permissionDeny" jsonb NOT NULL DEFAULT '[]', "approvedByUserId" uuid, "approvedAt" TIMESTAMP WITH TIME ZONE, "rejectionReason" text, "lastLoginAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "venue_settings" ("id" smallint NOT NULL, "venueName" character varying(160) NOT NULL DEFAULT 'SmartServe', "currency" character varying(3) NOT NULL DEFAULT 'AMD', "timezone" character varying(100) NOT NULL DEFAULT 'Asia/Yerevan', "sauceUnitPrice" numeric(10,2) NOT NULL DEFAULT '350', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ccea70b37b36d37c6461bb1ed64" PRIMARY KEY ("id"))`);
        await queryRunner.query(`INSERT INTO "venue_settings" ("id") VALUES (1)`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_cdb99c05982d5191ac8465ac010" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_2a7fdd7af437285a3ef0fc8b64f" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_d1c3294f3925bb9d31512067e5e" FOREIGN KEY ("sessionId") REFERENCES "dining_sessions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dining_sessions" ADD CONSTRAINT "FK_143bcb934c483e3bb7e5955c3c2" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "basket_items" ADD CONSTRAINT "FK_0ec0a550b8a734addaf082a194f" FOREIGN KEY ("sessionId") REFERENCES "dining_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "basket_items" ADD CONSTRAINT "FK_bca53dec99316713d968c6a2141" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_368e146b785b574f42ae9e53d5e" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_9d9a42b5561488294a4de3f9e20" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_9d9a42b5561488294a4de3f9e20"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_368e146b785b574f42ae9e53d5e"`);
        await queryRunner.query(`ALTER TABLE "basket_items" DROP CONSTRAINT "FK_bca53dec99316713d968c6a2141"`);
        await queryRunner.query(`ALTER TABLE "basket_items" DROP CONSTRAINT "FK_0ec0a550b8a734addaf082a194f"`);
        await queryRunner.query(`ALTER TABLE "dining_sessions" DROP CONSTRAINT "FK_143bcb934c483e3bb7e5955c3c2"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_d1c3294f3925bb9d31512067e5e"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_2a7fdd7af437285a3ef0fc8b64f"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_cdb99c05982d5191ac8465ac010"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"`);
        await queryRunner.query(`DROP TABLE "venue_settings"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bca53dec99316713d968c6a214"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ec0a550b8a734addaf082a194"`);
        await queryRunner.query(`DROP TABLE "basket_items"`);
        await queryRunner.query(`DROP INDEX "public"."uq_open_session_per_table"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_143bcb934c483e3bb7e5955c3c"`);
        await queryRunner.query(`DROP TABLE "dining_sessions"`);
        await queryRunner.query(`DROP TABLE "tables"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d1c3294f3925bb9d31512067e5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2a7fdd7af437285a3ef0fc8b64"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."order_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cdb99c05982d5191ac8465ac01"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f1d359a55923bb45b057fbdab0"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }

}
