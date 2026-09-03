import { Module } from "@nestjs/common";
import { SaucesService } from "./sauces.service";
import { SaucesController } from "./sauces.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Sauce } from "src/entities/sauce.entity";
import { ProductSauce } from "src/entities/product-sauce.entity";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([Sauce, ProductSauce]), UsersModule],
  providers: [SaucesService],
  controllers: [SaucesController],
  exports: [SaucesService],
})
export class SaucesModule {}
