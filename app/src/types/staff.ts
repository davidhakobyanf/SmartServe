export const PERMISSIONS = [
  'dashboard.view',
  'menu.view',
  'categories.manage',
  'products.manage',
  'orders.view',
  'orders.manage',
  'revenue.view',
  'tables.view',
  'tables.manage',
  'tables.qr.manage',
  'waiter_calls.view',
  'waiter_calls.manage',
  'users.view',
  'users.manage',
  'users.approve',
  'roles.manage',
  'venue.settings.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export interface AuthenticatedStaff {
  id: string;
  name: string;
  surname: string;
  email: string;
  status: StaffUserStatus;
  permissions: Permission[];
  role: StaffRoleSummary;
}
export type StaffUserStatus = 'pending' | 'active' | 'rejected' | 'disabled';

export interface StaffRoleSummary {
  id: string;
  name: string;
  nameTranslations?: LocalizedText;
  code: string;
}

export interface StaffRole extends StaffRoleSummary {
  permissions: Permission[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  status: StaffUserStatus;
  createdAt: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  lastLoginAt: string | null;
  permissionAllow: Permission[];
  permissionDeny: Permission[];
  role: StaffRoleSummary | null;
}

export interface RolePayload {
  name?: string;
  nameTranslations?: LocalizedText;
  code: string;
  permissions: Permission[];
}

export interface UpdateRolePayload {
  name?: string;
  nameTranslations?: LocalizedText;
  permissions?: Permission[];
}

export interface UpdateUserPermissionsPayload {
  permissionAllow: Permission[];
  permissionDeny: Permission[];
}
import type { LocalizedText } from './localization';
