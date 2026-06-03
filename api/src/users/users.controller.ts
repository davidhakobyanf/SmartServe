import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';

@Controller('api/register')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  register(@Body() dto: RegisterDto) {
    return this.usersService.register(dto);
  }
}
