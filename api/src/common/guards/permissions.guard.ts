import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core/services/reflector.service";
import { UsersService } from "src/users/users.service";
import { Permission } from "../auth/permission";
import { PERMISSIONS_KEY } from "../auth/permissions.decorator";
import { AuthenticatedRequest } from "./jwt-auth.guard";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({ error: "User is not authenticated" });
    }

    const effective = new Set(this.usersService.getEffectivePermissions(user));
    const missing = required.filter((permission) => !effective.has(permission));

    if(missing.length > 0) {
        throw new ForbiddenException({
            error: "Insufficient permissions",
            missing,
        })
    }

    return true;
   }
}
