import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
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

  @Delete(":id")
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.saucesService.remove(id);
  }
}

@Controller("api/sauce-images")
export class SauceImagesController {
  constructor(private readonly saucesService: SaucesService) {}

  @Get(":id")
  async getImage(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const image = await this.saucesService.getImage(id);
    response.setHeader("Content-Type", image.mimeType);
    response.setHeader("Cache-Control", "public, max-age=86400");
    response.send(image.buffer);
  }
}
