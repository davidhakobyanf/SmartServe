import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ProfileService } from './profile.service';
import { ProfileController, ProfileImagesController } from './profile.controller';

@Module({
  imports: [UsersModule],
  controllers: [ProfileController, ProfileImagesController],
  providers: [ProfileService],
})
export class ProfileModule {}
