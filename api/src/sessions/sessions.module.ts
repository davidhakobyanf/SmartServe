import { Module } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { SessionsController } from "./sessions.controller";
import { DiningSession } from "src/entities/dining-session.entity";
import { TypeOrmModule } from "@nestjs/typeorm";


@Module({
    imports: [TypeOrmModule.forFeature([DiningSession])],
    controllers: [SessionsController],
    providers: [SessionsService],
    exports: [SessionsService],
})
export class SessionsModule {}