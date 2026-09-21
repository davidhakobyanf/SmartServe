import { Module } from "@nestjs/common";
import { WaiterGateway } from "./waiter.gateway";
import { SessionsModule } from "src/sessions/sessions.module";
import { UsersModule } from "src/users/users.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WaiterCall } from "src/entities/waiter-call.entity";
import { WaiterCallsService } from "./waiter-calls.service";
import { WaiterController } from "./waiter.controller";

@Module({
    imports: [SessionsModule, UsersModule, TypeOrmModule.forFeature([WaiterCall])],
    providers: [WaiterGateway, WaiterCallsService],
    controllers: [WaiterController],
})
export class WaiterModule {}
