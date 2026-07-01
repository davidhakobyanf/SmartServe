import { Module } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { SessionsController } from "./sessions.controller";
import { DiningSession } from "src/entities/dining-session.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SessionsGateway } from "./session.gateway";

@Module({
    imports: [TypeOrmModule.forFeature([DiningSession])],
    controllers: [SessionsController],
    providers: [SessionsService, SessionsGateway],
    exports: [SessionsService],
})
export class SessionsModule {}