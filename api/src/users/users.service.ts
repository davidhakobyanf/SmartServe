import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { SessionProfile } from '../entities/session-profile.entity';
import { isValidPassword } from '../common/utils/password.util';
import { sanitizeMenuCards } from '../common/utils/menu-card-response.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
        'Invalid password. It must be at least 6 characters long with a mix of lowercase, uppercase, digits, and special characters.',
      );
    }

    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      name: dto.name,
      surname: dto.surname,
      email: dto.email,
      password: hashedPassword,
      cards: [],
    });
    await this.usersRepo.save(user);

    const token = this.jwtService.sign({ userId: user.id });
    return { message: 'User registered successfully', token };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new NotFoundException({
        error: 'User not found or incorrect password',
      });
    }

    await this.setActiveUser(user.id);

    return {
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

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }
}
