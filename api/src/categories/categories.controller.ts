import { sendImage } from "../common/http/image-response";
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
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { CategoriesService } from "./categories.service";
import { RequirePermissions } from "src/common/auth/permissions.decorator";
import { Permission } from "src/common/auth/permission";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { localizedNameResponse } from "src/common/i18n/localized-response";

@Controller("api/categories")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions(Permission.MENU_VIEW)
  async findAll(@Headers("accept-language") locale?: string) {
    return (await this.categoriesService.findAll()).map((category) =>
      localizedNameResponse(category, locale),
    );
  }

  @Post()
  @RequirePermissions(Permission.CATEGORIES_MANAGE)
  async create(
    @Body() dto: CreateCategoryDto,
    @Headers("accept-language") locale?: string,
  ) {
    return localizedNameResponse(
      await this.categoriesService.create(dto),
      locale,
    );
  }

  @Patch(":id")
  @RequirePermissions(Permission.CATEGORIES_MANAGE)
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
    @Headers("accept-language") locale?: string,
  ) {
    return localizedNameResponse(
      await this.categoriesService.update(id, dto),
      locale,
    );
  }

  @Delete(":id")
  @RequirePermissions(Permission.CATEGORIES_MANAGE)
  remove(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.categoriesService.remove(id);
  }
}

@Controller("api/category-images")
export class CategoryImagesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get(":id")
  async getImage(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const image = await this.categoriesService.getImage(id);
    sendImage(response, image);
  }
}
