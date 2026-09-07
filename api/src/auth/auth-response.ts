import { User } from "../entities/user.entity";
import { getEffectivePermissions } from "../common/auth/effective-permissions";
import { roleSummary } from "../roles/role-response";

export function authenticatedUserResponse(user: User, locale?: string) {
  const permissions = getEffectivePermissions(user);

  return {
    id: user.id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    status: user.status,
    permissions,
    role: roleSummary(user.role!, locale),
  };
}
