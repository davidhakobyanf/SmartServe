import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BasketItem } from "src/entities/basket-item.entity";
import { DiningSession } from "src/entities/dining-session.entity";
import { OrderItem } from "src/entities/order-item.entity";
import { Order } from "src/entities/order.entity";
import { SessionsModule } from "src/sessions/sessions.module";
import { UsersModule } from "src/users/users.module";
import { OrdersController } from "./orders.controller";
import { OrdersGateway } from "./orders.gateway";
import { OrdersService } from "./orders.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      BasketItem,
      DiningSession,
    ]),
    SessionsModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway],
  exports: [OrdersService],
})
export class OrdersModule {}
