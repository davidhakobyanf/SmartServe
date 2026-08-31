import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { RolesService } from "./roles.service";
import { RequirePermissions } from "src/common/auth/permissions.decorator";
import { Permission } from "src/common/auth/permission";
import { CreateRoleDto } from "./dto/create-role.dto";

@Controller("api/roles")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(Permission.ROLES_MANAGE)
  async findAll() {
    const roles = await this.rolesService.findAll();

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      code: role.code,
      permissions: role.permissions,
      isSystem: role.isSystem,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));
  }

  @Post()
  @RequirePermissions(Permission.ROLES_MANAGE)
  async create(@Body() dto: CreateRoleDto) {
    const role = await this.rolesService.create(dto);
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      permissions: role.permissions,
      isSystem: role.isSystem,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
