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
import { TablesService } from "./tables.service";
import { CreateTableDto } from "./dto/create-table.dto";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { Permission } from "src/common/auth/permission";
import { RequirePermissions } from "src/common/auth/permissions.decorator";
import { UpdateTableDto } from "./dto/update-table.dto";

@Controller("api/tables")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @RequirePermissions(Permission.TABLES_VIEW)
  findAll() {
    return this.tablesService.findAll();
  }

  @Post()
  @RequirePermissions(Permission.TABLES_MANAGE)
  create(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  @Patch(":id")
  @RequirePermissions(Permission.TABLES_MANAGE)
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.tablesService.update(id, dto);
  }
}
