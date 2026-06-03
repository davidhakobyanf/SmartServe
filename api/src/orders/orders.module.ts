import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderStore } from '../entities/order-store.entity';
import { OrdersService } from './orders.service';
import { OrdersController, OrdersAllController } from './orders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrderStore])],
  controllers: [OrdersController, OrdersAllController],
  providers: [OrdersService],
})
export class OrdersModule {}
