import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { resolveLocalizedText } from 'src/common/i18n/localized-text';
import { decodeImage } from 'src/common/utils/image-upload.util';
import { isValidPassword } from 'src/common/utils/password.util';
import { User } from 'src/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class ProfileService {
  constructor(private readonly usersService: UsersService) {}

  getProfile(user: User, locale?: string) {
    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      status: user.status,
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
      permissions: this.usersService.getEffectivePermissions(user),
      avatarName: user.avatarName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      card: [],
    };
  }

  async updateProfile(user: User, dto: UpdateProfileDto, locale?: string) {
    if (dto.name === undefined && dto.surname === undefined && dto.email === undefined) {
      throw new BadRequestException('At least one field must be provided');
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (name.length < 2) throw new BadRequestException('Name is too short');
      user.name = name;
    }
    if (dto.surname !== undefined) {
      const surname = dto.surname.trim();
      if (surname.length < 2) throw new BadRequestException('Surname is too short');
      user.surname = surname;
    }
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.usersService.findByEmail(email);
      if (existing && existing.id !== user.id) {
        throw new ConflictException('Email is already in use');
      }
      user.email = email;
    }

    return this.getProfile(await this.usersService.saveUser(user), locale);
  }

  async changePassword(user: User, dto: ChangePasswordDto) {
    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (!isValidPassword(dto.newPassword)) {
      throw new BadRequestException(
        'Invalid password. It must be at least 6 characters long with a mix of lowercase, uppercase, digits, and special characters.',
      );
    }
    if (await bcrypt.compare(dto.newPassword, user.password)) {
      throw new BadRequestException('New password must be different');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.saveUser(user);
    return { success: true };
  }

  async updateAvatar(user: User, dto: UpdateAvatarDto) {
    if (!dto.image.data) {
      throw new BadRequestException('Avatar image is required');
    }
    if (!dto.image.mimeType || !AVATAR_MIME_TYPES.has(dto.image.mimeType)) {
      throw new BadRequestException('Avatar must be a JPG, PNG, or WebP image');
    }
    const avatar = decodeImage(dto.image, 'avatar');
    user.avatarName = avatar.imageName;
    user.avatarMimeType = avatar.imageMimeType;
    user.avatarData = avatar.imageData;
    const saved = await this.usersService.saveUser(user);
    return { avatarName: saved.avatarName, updatedAt: saved.updatedAt };
  }

  async removeAvatar(user: User) {
    user.avatarName = null;
    user.avatarMimeType = null;
    user.avatarData = null;
    const saved = await this.usersService.saveUser(user);
    return { success: true, updatedAt: saved.updatedAt };
  }

  async getAvatar(id: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const user = await this.usersService.findAvatarById(id);
    if (!user?.avatarData) {
      throw new NotFoundException('Avatar not found');
    }
    return {
      buffer: user.avatarData,
      mimeType: user.avatarMimeType || 'image/jpeg',
    };
  }
}
