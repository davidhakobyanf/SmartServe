import { Module } from '@nestjs/common';
import { BasketItemsController } from './basket-items.controller';
import { BasketItemsService } from './basket-items.service';

@Module({
  controllers: [BasketItemsController],
  providers: [BasketItemsService]
})
export class BasketItemsModule {}
