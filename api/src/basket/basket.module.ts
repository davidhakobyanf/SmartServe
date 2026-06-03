import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BasketStore } from '../entities/basket-store.entity';
import { BasketService } from './basket.service';
import { BasketController, BasketAllController } from './basket.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BasketStore])],
  controllers: [BasketController, BasketAllController],
  providers: [BasketService],
  exports: [BasketService],
})
export class BasketModule {}
