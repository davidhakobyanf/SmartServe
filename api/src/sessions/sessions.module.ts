import { Module } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { SessionsController } from "./sessions.controller";
import { DiningSession } from "src/entities/dining-session.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SessionsGateway } from "./session.gateway";
import { DiningTable } from "src/entities/dining-table.entity";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([DiningSession, DiningTable]),
    UsersModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsGateway],
  exports: [SessionsService],
})
export class SessionsModule {}
