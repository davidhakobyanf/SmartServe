import { User } from "../entities/user.entity";
import { roleSummary } from "../roles/role-response";
import { getEffectivePermissions } from "../common/auth/effective-permissions";

export function profileResponse(user: User, locale?: string) {
  return {
    id: user.id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    status: user.status,
    role: user.role
      ? roleSummary(user.role, locale)
      : null,
    permissions: getEffectivePermissions(user),
    avatarName: user.avatarName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
    card: [],
  };
}
