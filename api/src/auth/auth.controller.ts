import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { LoginDto } from "../users/dto/login.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { User } from "src/entities/user.entity";

@Controller("api")
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post(["user/login", "auth/login"])
  login(@Body() dto: LoginDto) {
    return this.usersService.login(dto);
  }

  @Get("auth/me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    const permissions = this.usersService.getEffectivePermissions(user);

    return {
      id: user.id,
      name: user.name,
      surname: user.surname,
      email: user.email,
      status: user.status,
      permissions,
      role: {
        id: user.role!.id,
        name: user.role!.name,
        code: user.role!.code,
      },
    };
  }
}
