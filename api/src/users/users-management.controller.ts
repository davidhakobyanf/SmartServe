import { Body, Controller, Get, Headers, Param, Patch, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/common/guards/permissions.guard";
import { UsersService } from "./users.service";
import { RequirePermissions } from "src/common/auth/permissions.decorator";
import { Permission } from "src/common/auth/permission";
import { ApproveUserDto } from "./dto/approve-user.dto";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { User } from "src/entities/user.entity";
import { RejectUserDto } from "./dto/reject-user.dto";
import { ChangeUserRoleDto } from "./dto/change-user-role.dto";
import { UpdateUserPermissionsDto } from "./dto/update-user-permissions.dto";
import { resolveLocalizedText } from "src/common/i18n/localized-text";
@Controller("api/users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersManagementController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(Permission.USERS_VIEW)
  async findAll(@Headers("accept-language") locale?: string) {
    const users = await this.usersService.findAll();

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      approvedAt: user.approvedAt,
      rejectionReason: user.rejectionReason,
      lastLoginAt: user.lastLoginAt,
      permissionAllow: user.permissionAllow,
      permissionDeny: user.permissionDeny,
      role: user.role
        ? {
            id: user.role.id,
            name: resolveLocalizedText(
              user.role.nameTranslations,
              user.role.name,
              locale,
            ),
            code: user.role.code,
          }
        : null,
    }));
  }

  @Patch(":id/approve")
  @RequirePermissions(Permission.USERS_APPROVE)
  async approve(
    @Param("id") id: string,
    @Body() dto: ApproveUserDto,
    @CurrentUser() approver: User,
  ) {
    const user = await this.usersService.approve(id, dto.roleId, approver.id);
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      roleId: user.roleId,
      approvedByUserId: user.approvedByUserId,
      approvedAt: user.approvedAt,
    };
  }

  @Patch(":id/reject")
  @RequirePermissions(Permission.USERS_APPROVE)
  async reject(@Param("id") id: string, @Body() dto: RejectUserDto) {
    const user = await this.usersService.reject(id, dto.reason);
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      rejectionReason: user.rejectionReason,
    };
  }

  @Patch(":id/disable")
  @RequirePermissions(Permission.USERS_MANAGE)
  async disable(@Param("id") id: string, @CurrentUser() actor: User) {
    const user = await this.usersService.disable(id, actor.id);
    return {
      id: user.id,
      email: user.email,
      status: user.status,
    };
  }

  @Patch(":id/enable")
  @RequirePermissions(Permission.USERS_MANAGE)
  async enable(@Param("id") id: string) {
    const user = await this.usersService.enable(id);
    return {
      id: user.id,
      email: user.email,
      status: user.status,
    };
  }

  @Patch(":id/role")
  @RequirePermissions(Permission.USERS_MANAGE)
  async changeRole(
    @Param("id") id: string,
    @Body() dto: ChangeUserRoleDto,
    @CurrentUser() actor: User,
    @Headers("accept-language") locale?: string,
  ) {
    const user = await this.usersService.changeRole(id, dto.roleId, actor.id);
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      roleId: user.roleId,
      role: user.role
        ? {
            id: user.role.id,
            name: resolveLocalizedText(
              user.role.nameTranslations,
              user.role.name,
              locale,
            ),
            code: user.role.code,
          }
        : null,
    };
  }

  @Patch(":id/permissions")
  @RequirePermissions(Permission.USERS_MANAGE)
  async updatePermissions(
    @Param("id") id: string,
    @Body() dto: UpdateUserPermissionsDto,
    @CurrentUser() actor: User,
  ) {
    const user = await this.usersService.updatePermissions(
      id,
      dto.permissionAllow,
      dto.permissionDeny,
      actor.id,
    );
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      permissionAllow: user.permissionAllow,
      permissionDeny: user.permissionDeny,
      effectivePermissions: this.usersService.getEffectivePermissions(user),
    };
  }
}
