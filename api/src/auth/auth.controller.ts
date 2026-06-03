import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginDto } from '../users/dto/login.dto';

@Controller('api/user/login')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  login(@Body() dto: LoginDto) {
    return this.usersService.login(dto);
  }
}
