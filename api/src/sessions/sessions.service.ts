import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { DiningSession } from "src/entities/dining-session.entity";
import { Repository } from "typeorm";
import { SessionClosedPayload } from "./session.gateway";
import { DOMAIN_EVENTS } from "./session.gateway";
import { DiningTable } from "src/entities/dining-table.entity";

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(DiningSession)
    private readonly sessionRepo: Repository<DiningSession>,
    @InjectRepository(DiningTable)
    private readonly tablesRepo: Repository<DiningTable>,

    private readonly events: EventEmitter2,
  ) {}
   
  

  async openForTable(tableToken: string): Promise<DiningSession> {
    const table = await this.tablesRepo.findOne({
      where: {
        publicToken: tableToken,
        isActive: true,
      },
    });

    if (!table) {
      throw new NotFoundException("Table not found");
    }

    const existingSession = await this.sessionRepo.findOne({
      where: {
        tableId: table.id,
        status: "open",
      },
      relations: {
        table: true,
      },
    });

    if (existingSession) {
      return existingSession;
    }

    const session = this.sessionRepo.create({
      tableId: table.id,
      table,
      status: "open",
      closedAt: null,
    });

    return this.sessionRepo.save(session);
  }

  async getByToken(id: string): Promise<DiningSession> {
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: {
        table: true,
      },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    return session;
  }

  async assertOpen(id: string): Promise<DiningSession> {
    const session = await this.getByToken(id);

    if (session.status !== "open") {
      throw new ForbiddenException("Session is closed or invalid");
    }

    return session;
  }

  async close(id: string): Promise<DiningSession> {
    const session = await this.getByToken(id);
    if (session.status === "closed") return session;

    session.status = "closed";
    session.closedAt = new Date();
    const saved = await this.sessionRepo.save(session);

    const payload: SessionClosedPayload = {
      sessionId: saved.id,
      tableNumber: saved.table.number,
    };

    this.events.emit(DOMAIN_EVENTS.SESSION_CLOSED, payload);
    return saved;
  }

  async listOpen(): Promise<DiningSession[]> {
    return this.sessionRepo.find({
      where: {
        status: "open",
      },
      relations: {
        table: true,
      },
    });
  }
}
