import { Module } from "@nestjs/common";
import { WaiterGateway } from "./waiter.gateway";

@Module({
    providers: [WaiterGateway],
})
export class WaiterModule {}