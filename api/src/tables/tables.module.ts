import { Module } from "@nestjs/common";
import { DiningTable } from "src/entities/dining-table.entity";
import { TablesService } from "./tables.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TablesController } from "./tables.controller";
import { UsersModule } from "../users/users.module";
import { DiningSession } from "src/entities/dining-session.entity";
import { TablesGateway } from "./tables.gateway";

@Module({
  imports: [
    TypeOrmModule.forFeature([DiningTable, DiningSession]),
    UsersModule,
  ],
  controllers: [TablesController],
  providers: [TablesService, TablesGateway],
  exports: [TablesService],
})
export class TablesModule {}
