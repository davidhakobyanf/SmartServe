import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BasketStore } from '../entities/basket-store.entity';
import { BasketService } from './basket.service';
import { BasketController, BasketAllController } from './basket.controller';
import { SessionsModule } from 'src/sessions/sessions.module';
@Module({
  imports: [TypeOrmModule.forFeature([BasketStore]) , SessionsModule],
  controllers: [BasketController, BasketAllController],
  providers: [BasketService],
  exports: [BasketService],
})
export class BasketModule {}
