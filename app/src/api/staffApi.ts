import { apiClient } from './api';
import type {
  RolePayload,
  StaffRole,
  StaffUser,
  UpdateRolePayload,
  UpdateUserPermissionsPayload,
} from '@/types/staff';

const staffApi = {
  async getUsers(): Promise<StaffUser[]> {
    const { data } = await apiClient.get<StaffUser[]>('/api/users');
    return data;
  },

  async getRoles(): Promise<StaffRole[]> {
    const { data } = await apiClient.get<StaffRole[]>('/api/roles');
    return data;
  },

  async approveUser(userId: string, roleId: string): Promise<void> {
    await apiClient.patch(`/api/users/${userId}/approve`, { roleId });
  },

  async rejectUser(userId: string, reason: string): Promise<void> {
    await apiClient.patch(`/api/users/${userId}/reject`, { reason });
  },

  async disableUser(userId: string): Promise<void> {
    await apiClient.patch(`/api/users/${userId}/disable`);
  },

  async enableUser(userId: string): Promise<void> {
    await apiClient.patch(`/api/users/${userId}/enable`);
  },

  async changeUserRole(userId: string, roleId: string): Promise<void> {
    await apiClient.patch(`/api/users/${userId}/role`, { roleId });
  },

  async updateUserPermissions(
    userId: string,
    payload: UpdateUserPermissionsPayload,
  ): Promise<void> {
    await apiClient.patch(`/api/users/${userId}/permissions`, payload);
  },

  async createRole(payload: RolePayload): Promise<void> {
    await apiClient.post('/api/roles', payload);
  },

  async updateRole(roleId: string, payload: UpdateRolePayload): Promise<void> {
    await apiClient.patch(`/api/roles/${roleId}`, payload);
  },

  async disableRole(roleId: string): Promise<void> {
    await apiClient.patch(`/api/roles/${roleId}/disable`);
  },

  async enableRole(roleId: string): Promise<void> {
    await apiClient.patch(`/api/roles/${roleId}/enable`);
  },
};

export default staffApi;
