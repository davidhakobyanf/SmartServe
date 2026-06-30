import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { error } from "console";
import { DiningSession } from "src/entities/dining-session.entity";
import { Repository } from "typeorm";



@Injectable()
export class SessionsService {
    constructor(
        @InjectRepository(DiningSession)
        private readonly sessionRepo: Repository<DiningSession>,
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
        return this.sessionRepo.save(session);
    }

    async listOpen(): Promise<DiningSession[]> {
        return this.sessionRepo.find({where: {status: 'open'}});
    }




}