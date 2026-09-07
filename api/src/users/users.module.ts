import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { UsersManagementController } from './users-management.controller';
import { Role } from 'src/entities/role.entity';
import { UserAuthenticationService } from './user-authentication.service';
import { StaffManagementService } from './staff-management.service';
import { UsersRepository } from './users.repository';
import { StaffSocketAuthService } from './staff-socket-auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '1h'),
        },
      }),
    }),
  ],
  controllers: [UsersController, UsersManagementController],
  providers: [
    UsersService,
    UserAuthenticationService,
    StaffManagementService,
    UsersRepository,
    StaffSocketAuthService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
  exports: [UsersService, StaffSocketAuthService, JwtAuthGuard, PermissionsGuard, JwtModule],
})
export class UsersModule {}
