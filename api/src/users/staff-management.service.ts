import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { Role } from "../entities/role.entity";
import { UserStatus } from "../common/auth/user-status";
import { Permission } from "../common/auth/permission";

@Injectable()
export class StaffManagementService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
  ) {}

  async approve(
    userId: string,
    roleId: string,
    approverId: string,
  ): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException("Only pending users can be approved");
    }

    const role = await this.rolesRepo.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException("Role not found");
    }
    if (!role.isActive) {
      throw new BadRequestException("An inactive role cannot be assigned");
    }
    user.status = UserStatus.ACTIVE;
    user.roleId = role.id;
    user.approvedByUserId = approverId;
    user.approvedAt = new Date();
    user.rejectionReason = null;

    return this.usersRepo.save(user);
  }

  async reject(userId: string, reason: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.status !== UserStatus.PENDING) {
      throw new BadRequestException("Only pending users can be rejected");
    }
    user.status = UserStatus.REJECTED;
    user.rejectionReason = reason;
    user.approvedByUserId = null;
    user.approvedAt = null;

    return this.usersRepo.save(user);
  }

  async disable(userId: string, actorId: string): Promise<User> {
    if (userId === actorId) {
      throw new BadRequestException("You cannot disable your own account");
    }

    const user = await this.usersRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException("Only active users can be disabled");
    }

    const ownerRole = await this.rolesRepo.findOne({
      where: { code: "owner" },
    });

    if (ownerRole && user.roleId === ownerRole.id) {
      const activeOwnersCount = await this.usersRepo.count({
        where: {
          roleId: ownerRole.id,
          status: UserStatus.ACTIVE,
        },
      });

      if (activeOwnersCount <= 1) {
        throw new BadRequestException(
          "The last active owner cannot be disabled",
        );
      }
    }

    user.status = UserStatus.DISABLED;

    return this.usersRepo.save(user);
  }

  async enable(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.status !== UserStatus.DISABLED) {
      throw new BadRequestException("Only disabled users can be enabled");
    }

    if (!user.role || !user.role.isActive) {
      throw new BadRequestException(
        "An active role must be assigned before enabling the user",
      );
    }

    user.status = UserStatus.ACTIVE;

    return this.usersRepo.save(user);
  }

  async changeRole(
    userId: string,
    roleId: string,
    actorId: string,
  ): Promise<User> {
    if (userId === actorId) {
      throw new BadRequestException("You cannot change your own role");
    }
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (
      user.status !== UserStatus.ACTIVE &&
      user.status !== UserStatus.DISABLED
    ) {
      throw new BadRequestException(
        "Only active or disabled users can have their role changed",
      );
    }

    const newRole = await this.rolesRepo.findOne({
      where: { id: roleId },
    });

    if (!newRole) {
      throw new NotFoundException("Role not found");
    }
    if (!newRole.isActive) {
      throw new BadRequestException("An inactive role cannot be assigned");
    }
    if (user.roleId === newRole.id) {
      throw new BadRequestException("The user already has this role");
    }

    if (
      user.status === UserStatus.ACTIVE &&
      user.role?.code === "owner" &&
      newRole.code !== "owner"
    ) {
      const activeOwnersCount = await this.usersRepo.count({
        where: {
          roleId: user.role.id,
          status: UserStatus.ACTIVE,
        },
      });
      if (activeOwnersCount <= 1) {
        throw new BadRequestException(
          "The last active owner cannot lose the owner role",
        );
      }
    }

    user.roleId = newRole.id;
    user.role = newRole;

    return this.usersRepo.save(user);
  }

  async updatePermissions(
    userId: string,
    permissionAllow: Permission[],
    permissionDeny: Permission[],
    actorId: string,
  ): Promise<User> {
    if (userId === actorId) {
      throw new BadRequestException("You cannot change your own permissions");
    }

    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (
      user.status !== UserStatus.ACTIVE &&
      user.status !== UserStatus.DISABLED
    ) {
      throw new BadRequestException(
        "Only active or disabled users can have their permissions changed",
      );
    }

    if (user.role?.code === "owner") {
      throw new BadRequestException("Owner permissions cannot be overridden");
    }

    const deniedPermissions = new Set(permissionDeny);

    const conflictingPermissions = permissionAllow.filter((permission) =>
      deniedPermissions.has(permission),
    );

    if (conflictingPermissions.length > 0) {
      throw new BadRequestException({
        message: "A permission cannot be both allowed and denied",
        conflictingPermissions,
      });
    }

    user.permissionAllow = [...permissionAllow];
    user.permissionDeny = [...permissionDeny];

    return this.usersRepo.save(user);
  }
}
