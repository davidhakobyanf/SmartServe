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
import { TablesService } from "./tables.service";
import { CreateTableDto } from "./dto/create-table.dto";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { Permission } from "src/common/auth/permission";
import { RequirePermissions } from "src/common/auth/permissions.decorator";
import { UpdateTableDto } from "./dto/update-table.dto";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { User } from "src/entities/user.entity";
import { tableResponse } from "./table-response";

@Controller("api/tables")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TablesController {
  constructor(
    private readonly tablesService: TablesService,
  ) {}

  @Get()
  @RequirePermissions(Permission.TABLES_VIEW)
  async findAll(
    @CurrentUser() user: User,
    @Headers("accept-language") locale?: string,
  ) {
    const tables = await this.tablesService.findAll();
    return tables.map((table) => tableResponse(user, table, locale));
  }

  @Post()
  @RequirePermissions(Permission.TABLES_MANAGE)
  async create(
    @Body() dto: CreateTableDto,
    @CurrentUser() user: User,
    @Headers("accept-language") locale?: string,
  ) {
    return tableResponse(
      user,
      await this.tablesService.create(dto),
      locale,
    );
  }

  @Patch(":id")
  @RequirePermissions(Permission.TABLES_MANAGE)
  async update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTableDto,
    @CurrentUser() user: User,
    @Headers("accept-language") locale?: string,
  ) {
    return tableResponse(
      user,
      await this.tablesService.update(id, dto),
      locale,
    );
  }
}
