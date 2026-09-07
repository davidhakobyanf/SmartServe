import { User } from "../entities/user.entity";
import { getEffectivePermissions } from "../common/auth/effective-permissions";
import { roleSummary } from "../roles/role-response";

export function staffUserResponse(user: User, locale?: string) {
  return {
    id: user.id,
    name: user.name,
    surname: user.surname,
    email: user.email,
    status: user.status,
    createdAt: user.createdAt,
    approvedAt: user.approvedAt,
    rejectionReason: user.rejectionReason,
    lastLoginAt: user.lastLoginAt,
    permissionAllow: user.permissionAllow,
    permissionDeny: user.permissionDeny,
    role: user.role
      ? roleSummary(user.role, locale)
      : null,
  };
}

export function approvedUserResponse(user: User) {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    roleId: user.roleId,
    approvedByUserId: user.approvedByUserId,
    approvedAt: user.approvedAt,
  };
}

export function rejectedUserResponse(user: User) {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    rejectionReason: user.rejectionReason,
  };
}

export function userStatusResponse(user: User) {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
  };
}

export function userRoleResponse(user: User, locale?: string) {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    roleId: user.roleId,
    role: user.role
      ? roleSummary(user.role, locale)
      : null,
  };
}

export function userPermissionsResponse(user: User) {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    permissionAllow: user.permissionAllow,
    permissionDeny: user.permissionDeny,
    effectivePermissions: getEffectivePermissions(user),
  };
}
