import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VenueSettings } from "src/entities/venue-settings.entity";
import { UsersModule } from "src/users/users.module";
import { SessionsModule } from "src/sessions/sessions.module";
import {
  PublicVenueSettingsController,
  VenueSettingsController,
} from "./venue-settings.controller";
import { VenueSettingsService } from "./venue-settings.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([VenueSettings]),
    UsersModule,
    SessionsModule,
  ],
  controllers: [VenueSettingsController, PublicVenueSettingsController],
  providers: [VenueSettingsService],
  exports: [VenueSettingsService],
})
export class VenueSettingsModule {}
