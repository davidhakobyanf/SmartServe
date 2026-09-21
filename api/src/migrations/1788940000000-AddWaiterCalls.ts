import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWaiterCalls1788940000000 implements MigrationInterface {
  name = "AddWaiterCalls1788940000000";

  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE "waiter_calls" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionId" uuid NOT NULL, "tableNumber" integer NOT NULL, "calledAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "resolvedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_waiter_calls" PRIMARY KEY ("id"), CONSTRAINT "FK_waiter_calls_session" FOREIGN KEY ("sessionId") REFERENCES "dining_sessions"("id") ON DELETE CASCADE)`);
    await runner.query(`CREATE UNIQUE INDEX "uq_pending_waiter_call_per_session" ON "waiter_calls" ("sessionId") WHERE "resolvedAt" IS NULL`);
  }

  async down(runner: QueryRunner): Promise<void> {
    await runner.query(`DROP INDEX "uq_pending_waiter_call_per_session"`);
    await runner.query(`DROP TABLE "waiter_calls"`);
  }
}
