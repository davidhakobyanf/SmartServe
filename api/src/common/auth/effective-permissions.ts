import { Permission } from "./permission";

// Structural input keeps this rule independent of NestJS and TypeORM.
export interface PermissionSubject {
  role?: { code: string; permissions?: Permission[] } | null;
  permissionAllow?: Permission[];
  permissionDeny?: Permission[];
}

export function getEffectivePermissions(user: PermissionSubject): Permission[] {
  if (user.role?.code === "owner") {
    return Object.values(Permission);
  }

  const effectivePermissions = new Set<Permission>([
    ...(user.role?.permissions ?? []),
    ...(user.permissionAllow ?? []),
  ]);

  for (const deniedPermission of user.permissionDeny ?? []) {
    effectivePermissions.delete(deniedPermission);
  }

  return [...effectivePermissions];
}
