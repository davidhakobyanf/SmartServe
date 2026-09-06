import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('api/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(
    @CurrentUser() user: User,
    @Headers('accept-language') locale?: string,
  ) {
    return this.profileService.getProfile(user, locale);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
    @Headers('accept-language') locale?: string,
  ) {
    return this.profileService.updateProfile(user, dto, locale);
  }

  @Patch('password')
  changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(user, dto);
  }

  @Put('avatar')
  updateAvatar(@CurrentUser() user: User, @Body() dto: UpdateAvatarDto) {
    return this.profileService.updateAvatar(user, dto);
  }

  @Delete('avatar')
  removeAvatar(@CurrentUser() user: User) {
    return this.profileService.removeAvatar(user);
  }
}

@Controller('api/profile-images')
export class ProfileImagesController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':id')
  async getAvatar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const avatar = await this.profileService.getAvatar(id);
    response.setHeader('Content-Type', avatar.mimeType);
    response.setHeader('Cache-Control', 'public, max-age=86400');
    response.send(avatar.buffer);
  }
}
