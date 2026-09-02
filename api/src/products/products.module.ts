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

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category]),
    UsersModule,
    SessionsModule,
  ],
  controllers: [
    ProductsController,
    PublicMenuController,
    ProductImagesController,
  ],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
