import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { UserStatus } from "../common/auth/user-status";
import { isValidPassword } from "../common/utils/password.util";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class UserAuthenticationService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
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
}
