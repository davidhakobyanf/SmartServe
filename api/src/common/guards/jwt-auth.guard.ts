import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "src/users/users.service";
import { UserStatus } from "../auth/user-status";
import { User } from "src/entities/user.entity";

interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException({
        error: "Missing access token",
      });
    }

    const [scheme, token] = authorization.trim().split(/\s+/);
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException({
        error: "Invalid authorization header",
      });
    }
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new UnauthorizedException({
        error: "Invalid or expired access token",
      });
    }
    if (!payload.sub) {
      throw new UnauthorizedException({
        error: "Invalid access token payload",
      });
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        error: "User from access token was not found",
      });
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({
        error: "User is not active",
      });
    }
    if (!user.role || !user.role.isActive) {
      throw new ForbiddenException({
        error: "Active role is not assigned",
      });
    }
    request.user = user;
    return true;
  }
}


export interface AuthenticatedRequest extends Request {
    user?: User;
}