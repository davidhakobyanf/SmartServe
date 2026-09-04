import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Permission } from "src/common/auth/permission";
import { RequirePermissions } from "src/common/auth/permissions.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { CreateSauceDto } from "./dto/create-sauce.dto";
import { UpdateSauceDto } from "./dto/update-sauce.dto";
import { SaucesService } from "./sauces.service";
import { localizedNameResponse } from "src/common/i18n/localized-response";

@Controller("api/sauces")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SaucesController {
  constructor(private readonly saucesService: SaucesService) {}

  @Get()
  @RequirePermissions(Permission.MENU_VIEW)
  async findAll(@Headers("accept-language") locale?: string) {
    return (await this.saucesService.findAll()).map((sauce) =>
      localizedNameResponse(sauce, locale),
    );
  }

  @Post()
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  async create(
    @Body() dto: CreateSauceDto,
    @Headers("accept-language") locale?: string,
  ) {
    return localizedNameResponse(await this.saucesService.create(dto), locale);
  }

  @Patch(":id")
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSauceDto,
    @Headers("accept-language") locale?: string,
  ) {
    return localizedNameResponse(
      await this.saucesService.update(id, dto),
      locale,
    );
  }
}
