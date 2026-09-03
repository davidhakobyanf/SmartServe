import {
  Body,
  Controller,
  Get,
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

@Controller("api/sauces")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SaucesController {
  constructor(private readonly saucesService: SaucesService) {}

  @Get()
  @RequirePermissions(Permission.MENU_VIEW)
  findAll() {
    return this.saucesService.findAll();
  }

  @Post()
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  create(@Body() dto: CreateSauceDto) {
    return this.saucesService.create(dto);
  }

  @Patch(":id")
  @RequirePermissions(Permission.PRODUCTS_MANAGE)
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSauceDto,
  ) {
    return this.saucesService.update(id, dto);
  }
}
