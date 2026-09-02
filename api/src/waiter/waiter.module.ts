import { Module } from "@nestjs/common";
import { WaiterGateway } from "./waiter.gateway";
import { SessionsModule } from "src/sessions/sessions.module";
import { UsersModule } from "src/users/users.module";

@Module({
    imports: [SessionsModule, UsersModule],
    providers: [WaiterGateway],
})
export class WaiterModule {}
