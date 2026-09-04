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
import { UsersService } from "src/users/users.service";
import { DiningTable } from "src/entities/dining-table.entity";
import { localizedNameResponse } from "src/common/i18n/localized-response";

@Controller("api/tables")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TablesController {
  constructor(
    private readonly tablesService: TablesService,
    private readonly usersService: UsersService,
  ) {}

  private responseFor(user: User, table: DiningTable, locale?: string) {
    const canManageQr = this.usersService
      .getEffectivePermissions(user)
      .includes(Permission.TABLES_QR_MANAGE);
    const localizedTable = localizedNameResponse(table, locale);

    return canManageQr
      ? localizedTable
      : { ...localizedTable, publicToken: undefined };
  }

  @Get()
  @RequirePermissions(Permission.TABLES_VIEW)
  async findAll(
    @CurrentUser() user: User,
    @Headers("accept-language") locale?: string,
  ) {
    const tables = await this.tablesService.findAll();
    return tables.map((table) => this.responseFor(user, table, locale));
  }

  @Post()
  @RequirePermissions(Permission.TABLES_MANAGE)
  async create(
    @Body() dto: CreateTableDto,
    @CurrentUser() user: User,
    @Headers("accept-language") locale?: string,
  ) {
    return this.responseFor(
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
    return this.responseFor(
      user,
      await this.tablesService.update(id, dto),
      locale,
    );
  }
}
