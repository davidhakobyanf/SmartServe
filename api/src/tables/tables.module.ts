import { Module } from "@nestjs/common";
import { DiningTable } from "src/entities/dining-table.entity";
import { TablesService } from "./tables.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TablesController } from "./tables.controller";
import { UsersModule } from "../users/users.module";
import { DiningSession } from "src/entities/dining-session.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([DiningTable, DiningSession]),
    UsersModule,
  ],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
