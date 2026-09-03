import * as bcrypt from "bcrypt";
import { UserStatus } from "../common/auth/user-status";
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { SetupDto } from "./dto/setup.dto";
import { User } from "src/entities/user.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "src/entities/role.entity";
import { isValidPassword } from "src/common/utils/password.util";
import { Permission } from "src/common/auth/permission";

@Injectable()
export class SetupService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
  ) {}
  async setup(dto: SetupDto) {
    const [usersCount, rolesCount] = await Promise.all([
      this.usersRepo.count(),
      this.rolesRepo.count(),
    ]);
    if (usersCount > 0 || rolesCount > 0) {
      throw new ConflictException(
        "Application setup has already been completed.",
      );
    }
    if (!isValidPassword(dto.password)) {
      throw new BadRequestException(
        "Password must contain lowercase, uppercase, number and special character.",
      );
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const ownerRole = this.rolesRepo.create({
      name: "Owner",
      code: "owner",
      permissions: Object.values(Permission),
      isSystem: true,
      isActive: true,
    });

    const ownerUser = this.usersRepo.create({
      name: dto.name,
      surname: dto.surname,
      email: dto.email,
      password: hashedPassword,
      role: ownerRole,
      status: UserStatus.ACTIVE,
      permissionAllow: [],
      permissionDeny: [],
      approvedByUserId: null,
      approvedAt: new Date(),
      rejectionReason: null,
      lastLoginAt: null,
    });
    const { savedRole, savedUser } = await this.usersRepo.manager.transaction(
      async (manager) => {
        const savedRole = await manager.save(ownerRole);

        ownerUser.role = savedRole;
        ownerUser.roleId = savedRole.id;

        const savedUser = await manager.save(ownerUser);

        return {
          savedRole,
          savedUser,
        };
      },
    );
    return {
      message: "Application setup completed successfully.",
      user: {
        id: savedUser.id,
        name: savedUser.name,
        surname: savedUser.surname,
        email: savedUser.email,
        status: savedUser.status,
      },
      role: {
        id: savedRole.id,
        name: savedRole.name,
        code: savedRole.code,
        permissionsCount: savedRole.permissions.length,
      },
    };
  }
}
