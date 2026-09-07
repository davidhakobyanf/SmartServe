import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Permission } from "../common/auth/permission";
import { UserStatus } from "../common/auth/user-status";
import { getEffectivePermissions } from "../common/auth/effective-permissions";
import { UsersRepository } from "./users.repository";

type StaffSocketAuthorization =
  | { ok: true; permissions: Permission[] }
  | { ok: false; error: string };

@Injectable()
export class StaffSocketAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly users: UsersRepository,
  ) {}

  async authorize(
    accessToken: string,
    requiredPermission: Permission,
    inactiveUserError: string,
  ): Promise<StaffSocketAuthorization> {
    if (!accessToken) return { ok: false, error: "Missing access token" };

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(accessToken);
      const user = await this.users.findById(payload.sub);
      if (!user || user.status !== UserStatus.ACTIVE || !user.role?.isActive) {
        return { ok: false, error: inactiveUserError };
      }
      const permissions = getEffectivePermissions(user);
      if (!permissions.includes(requiredPermission)) {
        return { ok: false, error: `Missing ${requiredPermission} permission` };
      }
      return { ok: true, permissions };
    } catch {
      return { ok: false, error: "Invalid or expired access token" };
    }
  }
}
