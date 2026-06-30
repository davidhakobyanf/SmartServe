import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderStore } from '../entities/order-store.entity';
import { OrdersService } from './orders.service';
import { OrdersController, OrdersAllController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
import { SessionsModule } from 'src/sessions/sessions.module';
@Module({
  imports: [TypeOrmModule.forFeature([OrderStore]), SessionsModule],
  controllers: [OrdersController, OrdersAllController],
  providers: [OrdersService, OrdersGateway],
})
export class OrdersModule {}
