import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BasketItem } from "src/entities/basket-item.entity";
import { Product } from "src/entities/product.entity";
import { SessionsModule } from "src/sessions/sessions.module";
import { BasketItemsController } from "./basket-items.controller";
import { BasketItemsService } from "./basket-items.service";

@Module({
  imports: [TypeOrmModule.forFeature([BasketItem, Product]), SessionsModule],
  controllers: [BasketItemsController],
  providers: [BasketItemsService],
  exports: [BasketItemsService],
})
export class BasketItemsModule {}
