import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { SessionProfile } from "../entities/session-profile.entity";
import { isValidPassword } from "../common/utils/password.util";
import { sanitizeMenuCards } from "../common/utils/menu-card-response.util";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UserStatus } from "src/common/auth/user-status";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(SessionProfile)
    private readonly sessionRepo: Repository<SessionProfile>,
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
      cards: [],
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

    await this.setActiveUser(user.id);

    return {
      accessToken,
      name: user.name,
      surname: user.surname,
      email: user.email,
      card: sanitizeMenuCards(user.cards ?? []),
    };
  }

  async setActiveUser(userId: string) {
    let session = await this.sessionRepo.findOne({ where: { id: 1 } });
    if (!session) {
      session = this.sessionRepo.create({ id: 1, userId });
    } else {
      session.userId = userId;
    }
    await this.sessionRepo.save(session);
  }

  async getActiveUser(): Promise<User | null> {
    const session = await this.sessionRepo.findOne({ where: { id: 1 } });
    if (!session?.userId) return null;
    return this.usersRepo.findOne({ where: { id: session.userId } });
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
    return this.usersRepo.findOne({ where: { email } });
  }
}
