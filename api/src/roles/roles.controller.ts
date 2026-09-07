import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { RolesService } from "./roles.service";
import { RequirePermissions } from "src/common/auth/permissions.decorator";
import { Permission } from "src/common/auth/permission";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { User } from "src/entities/user.entity";
import { roleResponse } from "./role-response";

@Controller("api/roles")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(Permission.ROLES_MANAGE)
  async findAll(@Headers("accept-language") locale?: string) {
    const roles = await this.rolesService.findAll();
    return roles.map((role) => roleResponse(role, locale));
  }

  @Post()
  @RequirePermissions(Permission.ROLES_MANAGE)
  async create(
    @Body() dto: CreateRoleDto,
    @Headers("accept-language") locale?: string,
  ) {
    const role = await this.rolesService.create(dto);
    return roleResponse(role, locale);
  }

  @Patch(":id")
  @RequirePermissions(Permission.ROLES_MANAGE)
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto,
    @Headers("accept-language") locale?: string,
  ) {
    const role = await this.rolesService.update(id, dto);
    return roleResponse(role, locale);
  }
  @Patch(":id/enable")
  @RequirePermissions(Permission.ROLES_MANAGE)
  async enable(
    @Param("id") id: string,
    @Headers("accept-language") locale?: string,
  ) {
    const role = await this.rolesService.enable(id);
    return roleResponse(role, locale);
  }
  @Patch(":id/disable")
  @RequirePermissions(Permission.ROLES_MANAGE)
  async disable(
    @Param("id") id: string,
    @CurrentUser() actor: User,
    @Headers("accept-language") locale?: string,
  ) {
    const role = await this.rolesService.disable(id, actor.role!.id);
    return roleResponse(role, locale);
  }
}
