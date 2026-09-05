import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { Permission } from "src/common/auth/permission";
import { RequirePermissions } from "src/common/auth/permissions.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { UpdateVenueSettingsDto } from "./dto/update-venue-settings.dto";
import { VenueSettingsService } from "./venue-settings.service";

@Controller("api/venue-settings")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.VENUE_SETTINGS_MANAGE)
export class VenueSettingsController {
  constructor(private readonly settingsService: VenueSettingsService) {}

  @Get()
  get() {
    return this.settingsService.get();
  }

  @Patch()
  update(@Body() dto: UpdateVenueSettingsDto) {
    return this.settingsService.update(dto);
  }
}

@Controller("api/venue-settings/public")
export class PublicVenueSettingsController {
  constructor(private readonly settingsService: VenueSettingsService) {}

  @Get()
  get() {
    return this.settingsService.getPublic();
  }
}
