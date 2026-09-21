import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { WaiterCall } from "src/entities/waiter-call.entity";
import { IsNull, QueryFailedError, Repository } from "typeorm";

export type WaiterCallPayload = {
  id: string;
  table: string;
  calledAt: string;
};

@Injectable()
export class WaiterCallsService {
  constructor(
    @InjectRepository(WaiterCall)
    private readonly calls: Repository<WaiterCall>,
  ) {}

  private toPayload(call: WaiterCall): WaiterCallPayload {
    return {
      id: call.id,
      table: String(call.tableNumber),
      calledAt: call.calledAt.toISOString(),
    };
  }

  async call(sessionId: string, tableNumber: number): Promise<WaiterCallPayload> {
    let call = await this.calls.findOne({
      where: { sessionId, resolvedAt: IsNull() },
    });
    if (call) {
      const calledAt = new Date();
      const updated = await this.calls.update(
        { id: call.id, resolvedAt: IsNull() },
        { calledAt },
      );
      if (updated.affected) return this.toPayload({ ...call, calledAt });
    }
    try {
      call = await this.calls.save(
        this.calls.create({ sessionId, tableNumber, resolvedAt: null }),
      );
    } catch (error) {
      if (
        !(error instanceof QueryFailedError) ||
        (error.driverError as { code?: string }).code !== "23505"
      ) {
        throw error;
      }
      call = await this.calls.findOne({
        where: { sessionId, resolvedAt: IsNull() },
      });
      if (!call) throw error;
    }
    return this.toPayload(call);
  }

  async pending(): Promise<WaiterCallPayload[]> {
    const calls = await this.calls.createQueryBuilder("call")
      .innerJoin("call.session", "session")
      .where('call."resolvedAt" IS NULL')
      .andWhere("session.status = :status", { status: "open" })
      .orderBy('call."calledAt"', "DESC")
      .getMany();
    return calls.map((call) => this.toPayload(call));
  }

  async resolve(id: string): Promise<void> {
    await this.calls.update({ id, resolvedAt: IsNull() }, { resolvedAt: new Date() });
  }

  async resolveAll(): Promise<void> {
    await this.calls.update({ resolvedAt: IsNull() }, { resolvedAt: new Date() });
  }
}
