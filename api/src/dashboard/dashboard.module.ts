import { Module } from "@nestjs/common";
import { UsersModule } from "src/users/users.module";
import { VenueSettingsModule } from "src/venue-settings/venue-settings.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

@Module({
  imports: [UsersModule, VenueSettingsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
