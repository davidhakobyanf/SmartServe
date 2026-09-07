import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "src/entities/category.entity";
import { Product } from "src/entities/product.entity";
import { ProductsService } from "./products.service";
import { UsersModule } from "src/users/users.module";
import { PublicMenuController } from "./public-menu.controller";
import { SessionsModule } from "src/sessions/sessions.module";
import { ProductImagesController } from "./product-images.controller";
import { ProductSauce } from "src/entities/product-sauce.entity";
import { Sauce } from "src/entities/sauce.entity";
import { BasketItem } from "src/entities/basket-item.entity";
import { ProductsRepository } from "./products.repository";
import { ProductSaucesService } from "./product-sauces.service";
import { ProductImagesService } from "./product-images.service";
import { MenuGateway } from "./menu.gateway";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      ProductSauce,
      Sauce,
      BasketItem,
    ]),
    UsersModule,
    SessionsModule,
  ],
  controllers: [
    ProductsController,
    PublicMenuController,
    ProductImagesController,
  ],
  providers: [
    ProductsService,
    ProductsRepository,
    ProductSaucesService,
    ProductImagesService,
    MenuGateway,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
