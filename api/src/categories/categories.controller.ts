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
}
