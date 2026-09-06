import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { ILike, Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { isValidPassword } from "../common/utils/password.util";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UserStatus } from "src/common/auth/user-status";
import { Permission } from "src/common/auth/permission";
import { Role } from "src/entities/role.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
  ) {}

  async register(dto: RegisterDto) {
    if (!isValidPassword(dto.password)) {
      throw new BadRequestException(
        "Invalid password. It must be at least 6 characters long with a mix of lowercase, uppercase, digits, and special characters.",
      );
    }

    const existing = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException({
        message: "Application already exists.",
        status: existing.status,
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      name: dto.name,
      surname: dto.surname,
      email: dto.email,
      password: hashedPassword,
      status: UserStatus.PENDING,
      roleId: null,
    });
    await this.usersRepo.save(user);

    return { message: "Application submitted.Await approval." };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email },
      relations: { role: true },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException({
        error: "Invalid email or password",
      });
    }
    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException({
        message: "Application is awaiting manager approval.",
        status: user.status,
      });
    }
    if (user.status === UserStatus.REJECTED) {
      throw new ForbiddenException({
        message: "Application was rejected.",
        status: user.status,
        reason: user.rejectionReason,
      });
    }
    if (user.status === UserStatus.DISABLED) {
      throw new ForbiddenException({
        message: "Access is disabled.",
        status: user.status,
      });
    }
    if (!user.role || !user.role.isActive) {
      throw new ForbiddenException({
        message: "Active role is not assigned.",
        status: user.status,
      });
    }
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });
    user.lastLoginAt = new Date();
    await this.usersRepo.save(user);

    return {
      accessToken,
      name: user.name,
      surname: user.surname,
      email: user.email,
    };
  }

  async saveUser(user: User): Promise<User> {
    return this.usersRepo.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { id },
      relations: { role: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email: ILike(email) } });
  }

  async findAvatarById(id: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder("user")
      .addSelect("user.avatarData")
      .where("user.id = :id", { id })
      .getOne();
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find({
      relations: { role: true },
      order: { createdAt: "DESC" },
    });
  }

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

  getEffectivePermissions(user: User): Permission[] {
    if (user.role?.code === "owner") {
      return Object.values(Permission);
    }

    const effectivePermissions = new Set<Permission>([
      ...(user.role?.permissions ?? []),
      ...(user.permissionAllow ?? []),
    ]);

    for (const deniedPermission of user.permissionDeny ?? []) {
      effectivePermissions.delete(deniedPermission);
    }

    return [...effectivePermissions];
  }
}
