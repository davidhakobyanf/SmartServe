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
import { staffUserResponse, approvedUserResponse, rejectedUserResponse, userStatusResponse, userRoleResponse, userPermissionsResponse } from "./user-response";
@Controller("api/users")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersManagementController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(Permission.USERS_VIEW)
  async findAll(@Headers("accept-language") locale?: string) {
    const users = await this.usersService.findAll();

    return users.map((user) => staffUserResponse(user, locale));
  }

  @Patch(":id/approve")
  @RequirePermissions(Permission.USERS_APPROVE)
  async approve(
    @Param("id") id: string,
    @Body() dto: ApproveUserDto,
    @CurrentUser() approver: User,
  ) {
    const user = await this.usersService.approve(id, dto.roleId, approver.id);
    return approvedUserResponse(user);
  }

  @Patch(":id/reject")
  @RequirePermissions(Permission.USERS_APPROVE)
  async reject(@Param("id") id: string, @Body() dto: RejectUserDto) {
    const user = await this.usersService.reject(id, dto.reason);
    return rejectedUserResponse(user);
  }

  @Patch(":id/disable")
  @RequirePermissions(Permission.USERS_MANAGE)
  async disable(@Param("id") id: string, @CurrentUser() actor: User) {
    const user = await this.usersService.disable(id, actor.id);
    return userStatusResponse(user);
  }

  @Patch(":id/enable")
  @RequirePermissions(Permission.USERS_MANAGE)
  async enable(@Param("id") id: string) {
    const user = await this.usersService.enable(id);
    return userStatusResponse(user);
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
    return userRoleResponse(user, locale);
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
    return userPermissionsResponse(user);
  }
}
