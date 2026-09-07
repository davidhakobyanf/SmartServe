import { Injectable } from "@nestjs/common";
import { User } from "../entities/user.entity";
import { Permission } from "../common/auth/permission";
import { getEffectivePermissions } from "../common/auth/effective-permissions";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UserAuthenticationService } from "./user-authentication.service";
import { StaffManagementService } from "./staff-management.service";
import { UsersRepository } from "./users.repository";

// Stable feature facade: callers do not need to know how user workflows are split.
@Injectable()
export class UsersService {
  constructor(
    private readonly authentication: UserAuthenticationService,
    private readonly staff: StaffManagementService,
    private readonly users: UsersRepository,
  ) {}

  register(dto: RegisterDto) {
    return this.authentication.register(dto);
  }

  login(dto: LoginDto) {
    return this.authentication.login(dto);
  }

  saveUser(user: User): Promise<User> {
    return this.users.saveUser(user);
  }

  findById(id: string): Promise<User | null> {
    return this.users.findById(id);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findByEmail(email);
  }

  findAvatarById(id: string): Promise<User | null> {
    return this.users.findAvatarById(id);
  }

  findAll(): Promise<User[]> {
    return this.users.findAll();
  }

  approve(userId: string, roleId: string, approverId: string): Promise<User> {
    return this.staff.approve(userId, roleId, approverId);
  }

  reject(userId: string, reason: string): Promise<User> {
    return this.staff.reject(userId, reason);
  }

  disable(userId: string, actorId: string): Promise<User> {
    return this.staff.disable(userId, actorId);
  }

  enable(userId: string): Promise<User> {
    return this.staff.enable(userId);
  }

  changeRole(userId: string, roleId: string, actorId: string): Promise<User> {
    return this.staff.changeRole(userId, roleId, actorId);
  }

  updatePermissions(userId: string, allow: Permission[], deny: Permission[], actorId: string): Promise<User> {
    return this.staff.updatePermissions(userId, allow, deny, actorId);
  }

  getEffectivePermissions(user: User): Permission[] {
    return getEffectivePermissions(user);
  }
}
