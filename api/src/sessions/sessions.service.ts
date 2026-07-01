import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { DiningSession } from "src/entities/dining-session.entity";
import { Repository } from "typeorm";
import { SessionClosedPayload } from "./session.gateway";
import { DOMAIN_EVENTS } from "./session.gateway";



@Injectable()
export class SessionsService {
    constructor(
        @InjectRepository(DiningSession)
        private readonly sessionRepo: Repository<DiningSession>,
        private readonly events: EventEmitter2
    ) {}

    async openForTable(tableNumber: number): Promise<DiningSession> {
        const existing = await this.sessionRepo.findOne({
            where: {tableNumber, status:'open'},
            order: { createdAt: 'DESC'},
        });
        if (existing) return existing;

        const session = this.sessionRepo.create({
            tableNumber,
            status: 'open',
            closedAt:null,
        });
        return this.sessionRepo.save(session);
    }

    async getByToken(id: string): Promise<DiningSession> {
        const session = await this.sessionRepo.findOne({where: { id }});
        if (!session) {
            throw  new NotFoundException({error: 'Session not found'});
        }
        return session;
    }

    async assertOpen(id: string): Promise<DiningSession> {
        const session = await this.sessionRepo.findOne({where: {id}});
        if (!session || session.status !== 'open') {
            throw new ForbiddenException({ error: 'Session is closed or invalid'});
        }
        return session;
    }
    
    async close(id: string): Promise<DiningSession> {
        const session = await this.getByToken(id);
        if (session.status === 'closed') return session;

        session.status = 'closed';
        session.closedAt = new Date();
        const saved = await this.sessionRepo.save(session);

        const payload: SessionClosedPayload = {
            sessionId: saved.id,
            tableNumber: saved.tableNumber,
        };
        this.events.emit(DOMAIN_EVENTS.SESSION_CLOSED, payload);
        return saved;
    }

    async listOpen(): Promise<DiningSession[]> {
        return this.sessionRepo.find({where: {status: 'open'}});
    }




}