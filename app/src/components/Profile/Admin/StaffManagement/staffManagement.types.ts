import type { Permission } from '@/types/staff';
import type { LocalizedText } from '@/types/localization';

export type StaffView = 'users' | 'roles';
export type RoleAction = 'approve' | 'change';

export interface RoleSelectionValues { roleId: string; }
export interface RejectValues { reason: string; }
export interface PermissionValues {
  permissionAllow: Permission[];
  permissionDeny: Permission[];
}
export interface RoleFormValues {
  nameTranslations?: LocalizedText;
  code?: string;
  permissions: Permission[];
}
