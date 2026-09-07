import { Body, Controller, Get, Headers, Post, UseGuards } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { LoginDto } from "../users/dto/login.dto";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { User } from "src/entities/user.entity";
import { authenticatedUserResponse } from "./auth-response";

@Controller("api")
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post(["user/login", "auth/login"])
  login(@Body() dto: LoginDto) {
    return this.usersService.login(dto);
  }

  @Get("auth/me")
  @UseGuards(JwtAuthGuard)
  me(
    @CurrentUser() user: User,
    @Headers("accept-language") locale?: string,
  ) {
    return authenticatedUserResponse(user, locale);
  }
}
