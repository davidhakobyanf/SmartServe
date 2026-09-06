'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  App,
  Button,
  Form,
  Input,
  Spin,
} from 'antd';
import {
  TbPlus,
  TbRefresh,
  TbSearch,
} from 'react-icons/tb';
import staffApi from '@/api/staffApi';
import {
  PERMISSIONS,
  type StaffRole,
  type StaffUser,
} from '@/types/staff';
import css from './StaffManagement.module.css';
import { useProfileData } from '@/context/ProfileDataContext';
import {
  cleanLocalizedText,
  hasLocalizedText,
  missingContentLocales,
} from '@/types/localization';
import PageHeader from '@/components/Common/PageHeader/PageHeader';
import StaffStats from './StaffStats';
import StaffUsersTable from './StaffUsersTable';
import StaffRolesTable from './StaffRolesTable';
import { getApiErrorMessage } from '@/lib/apiError';
import StaffManagementModals from './StaffManagementModals';
import type {
  PermissionValues,
  RejectValues,
  RoleAction,
  RoleFormValues,
  RoleSelectionValues,
  StaffView,
} from './staffManagement.types';

const STAFF_API_ERROR_KEYS: Record<string, string> = {
  'A role with this code already exists.': 'roleCodeExists',
  'Role name cannot be empty': 'roleNameEmpty',
  'Role not found': 'roleNotFound',
  'System roles cannot be modified': 'systemRoleCannotBeModified',
  'At least one field must be provided': 'fieldRequired',
  'Only inactive roles can be enabled': 'onlyInactiveRoleCanBeEnabled',
  'You cannot disable your own role': 'cannotDisableOwnRole',
  'System roles cannot be disabled': 'systemRoleCannotBeDisabled',
  'Only active roles can be disabled': 'onlyActiveRoleCanBeDisabled',
  'User not found': 'userNotFound',
  'Only pending users can be approved': 'onlyPendingUserCanBeApproved',
  'An inactive role cannot be assigned': 'inactiveRoleCannotBeAssigned',
  'Only pending users can be rejected': 'onlyPendingUserCanBeRejected',
  'You cannot disable your own account': 'cannotDisableOwnAccount',
  'Only active users can be disabled': 'onlyActiveUserCanBeDisabled',
  'The last active owner cannot be disabled': 'lastOwnerCannotBeDisabled',
  'Only disabled users can be enabled': 'onlyDisabledUserCanBeEnabled',
  'An active role must be assigned before enabling the user': 'activeRoleRequired',
  'You cannot change your own role': 'cannotChangeOwnRole',
  'Only active or disabled users can have their role changed': 'roleChangeStatus',
  'The user already has this role': 'userAlreadyHasRole',
  'The last active owner cannot lose the owner role': 'lastOwnerCannotLoseRole',
  'You cannot change your own permissions': 'cannotChangeOwnPermissions',
  'Only active or disabled users can have their permissions changed': 'permissionChangeStatus',
  'Owner permissions cannot be overridden': 'ownerPermissionsCannotBeChanged',
  'A permission cannot be both allowed and denied': 'permissionConflict',
  'Missing access token': 'missingAccessToken',
  'Invalid authorization header': 'invalidAuthorizationHeader',
  'Invalid or expired access token': 'invalidOrExpiredToken',
  'Invalid access token payload': 'invalidToken',
  'User from access token was not found': 'tokenUserNotFound',
  'User is not active': 'userNotActive',
  'Active role is not assigned': 'activeRoleNotAssigned',
  'User is not authenticated': 'notAuthenticated',
  'Insufficient permissions': 'insufficientPermissions',
};

export default function StaffManagement() {
  const t = useTranslations('staff');
  const commonT = useTranslations('common');
  const { message } = App.useApp();
  const { permissions } = useProfileData();
  const canViewUsers = permissions.includes('users.view');
  const canApproveUsers = permissions.includes('users.approve');
  const canManageUsers = permissions.includes('users.manage');
  const canManageRoles = permissions.includes('roles.manage');
  const [view, setView] = useState<StaffView>('users');
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [roleTarget, setRoleTarget] = useState<StaffUser | null>(null);
  const [roleAction, setRoleAction] = useState<RoleAction>('approve');
  const [rejectTarget, setRejectTarget] = useState<StaffUser | null>(null);
  const [permissionTarget, setPermissionTarget] = useState<StaffUser | null>(null);
  const [editingRole, setEditingRole] = useState<StaffRole | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const [roleSelectionForm] = Form.useForm<RoleSelectionValues>();
  const [rejectForm] = Form.useForm<RejectValues>();
  const [permissionForm] = Form.useForm<PermissionValues>();
  const [roleForm] = Form.useForm<RoleFormValues>();

  const getLocalizedApiError = useCallback(
    (error: unknown, fallback: string): string => {
      const apiMessage = getApiErrorMessage(error, fallback);
      const translationKey = STAFF_API_ERROR_KEYS[apiMessage];
      return translationKey ? t(`apiErrors.${translationKey}`) : apiMessage;
    },
    [t],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextUsers, nextRoles] = await Promise.all([
        canViewUsers ? staffApi.getUsers() : Promise.resolve([]),
        canManageRoles ? staffApi.getRoles() : Promise.resolve([]),
      ]);
      setUsers(nextUsers);
      setRoles(nextRoles);
    } catch (error) {
      message.error(getLocalizedApiError(error, t('messages.loadError')));
    } finally {
      setLoading(false);
    }
  }, [canManageRoles, canViewUsers, getLocalizedApiError, message, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!canViewUsers && canManageRoles) setView('roles');
  }, [canManageRoles, canViewUsers]);

  const activeRoles = useMemo(
    () => roles.filter((role) => role.isActive),
    [roles],
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.name, user.surname, user.email, user.role?.name, user.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [search, users]);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) =>
      [role.name, role.code].some((value) => value.toLowerCase().includes(query)),
    );
  }, [roles, search]);

  const stats = useMemo(
    () => ({
      total: users.length,
      pending: users.filter((user) => user.status === 'pending').length,
      active: users.filter((user) => user.status === 'active').length,
      roles: roles.length,
    }),
    [roles.length, users],
  );

  const runAction = async (
    action: () => Promise<void>,
    successMessage: string,
  ) => {
    setActionLoading(true);
    try {
      await action();
      message.success(successMessage);
      await loadData();
      return true;
    } catch (error) {
      message.error(getLocalizedApiError(error, t('messages.actionError')));
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const openRoleSelection = (user: StaffUser, action: RoleAction) => {
    setRoleTarget(user);
    setRoleAction(action);
    roleSelectionForm.resetFields();

    if (action === 'change' && user.role?.id) {
      roleSelectionForm.setFieldValue('roleId', user.role.id);
    }
  };

  const submitRoleSelection = async (values: RoleSelectionValues) => {
    if (!roleTarget) return;
    const success = await runAction(
      () =>
        roleAction === 'approve'
          ? staffApi.approveUser(roleTarget.id, values.roleId)
          : staffApi.changeUserRole(roleTarget.id, values.roleId),
      roleAction === 'approve'
        ? t('messages.approved')
        : t('messages.roleChanged'),
    );
    if (success) {
      setRoleTarget(null);
      roleSelectionForm.resetFields();
    }
  };

  const submitReject = async (values: RejectValues) => {
    if (!rejectTarget) return;
    const success = await runAction(
      () => staffApi.rejectUser(rejectTarget.id, values.reason.trim()),
      t('messages.rejected'),
    );
    if (success) {
      setRejectTarget(null);
      rejectForm.resetFields();
    }
  };

  const openPermissions = (user: StaffUser) => {
    setPermissionTarget(user);
    permissionForm.setFieldsValue({
      permissionAllow: user.permissionAllow ?? [],
      permissionDeny: user.permissionDeny ?? [],
    });
  };

  const submitPermissions = async (values: PermissionValues) => {
    if (!permissionTarget) return;
    const success = await runAction(
      () =>
        staffApi.updateUserPermissions(permissionTarget.id, {
          permissionAllow: values.permissionAllow ?? [],
          permissionDeny: values.permissionDeny ?? [],
        }),
      t('messages.permissionsUpdated'),
    );
    if (success) setPermissionTarget(null);
  };

  const openCreateRole = () => {
    setEditingRole(null);
    roleForm.resetFields();
    roleForm.setFieldsValue({ permissions: [] });
    setRoleModalOpen(true);
  };

  const openEditRole = (role: StaffRole) => {
    setEditingRole(role);
    roleForm.setFieldsValue({
      nameTranslations: hasLocalizedText(role.nameTranslations)
        ? role.nameTranslations
        : { en: role.name },
      code: role.code,
      permissions: role.permissions,
    });
    setRoleModalOpen(true);
  };

  const submitRole = async (values: RoleFormValues) => {
    if (!hasLocalizedText(values.nameTranslations)) {
      message.error(commonT('translationRequired'));
      return;
    }
    const nameTranslations = cleanLocalizedText(values.nameTranslations);
    const success = await runAction(
      () =>
        editingRole
          ? staffApi.updateRole(editingRole.id, {
              nameTranslations,
              permissions: values.permissions ?? [],
            })
          : staffApi.createRole({
              nameTranslations,
              code: values.code ?? '',
              permissions: values.permissions ?? [],
            }),
      editingRole ? t('messages.roleUpdated') : t('messages.roleCreated'),
    );
    if (success) {
      const missing = missingContentLocales(nameTranslations);
      if (missing.length > 0) {
        message.warning(
          commonT('missingTranslations', {
            languages: missing
              .map((locale) => commonT(`lang_${locale}`))
              .join(', '),
          }),
        );
      }
      setRoleModalOpen(false);
      setEditingRole(null);
      roleForm.resetFields();
    }
  };

  const roleOptions = activeRoles.map((role) => ({
    value: role.id,
    label: `${role.name} (${role.code})`,
  }));
  const permissionOptions = PERMISSIONS.map((permission) => ({
    value: permission,
    label: t(`permissionLabels.${permission.replaceAll('.', '_')}`),
  }));

  return (
    <div className={css.page}>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <>
          {view === 'roles' && canManageRoles && (
            <Button type="primary" icon={<TbPlus />} onClick={openCreateRole}>
              {t('actions.createRole')}
            </Button>
          )}
          <Button icon={<TbRefresh />} onClick={() => void loadData()}>
            {t('actions.refresh')}
          </Button>
          </>
        }
      />

      <StaffStats {...stats} />

      <section className={css.card}>
        <div className={css.cardHeader}>
          <div className={css.tabs}>
            {canViewUsers && <button
              type="button"
              className={view === 'users' ? css.tabActive : css.tab}
              onClick={() => { setView('users'); setSearch(''); }}
            >
              {t('tabs.users')}
            </button>}
            {canManageRoles && <button
              type="button"
              className={view === 'roles' ? css.tabActive : css.tab}
              onClick={() => { setView('roles'); setSearch(''); }}
            >
              {t('tabs.roles')}
            </button>}
          </div>
          <Input
            allowClear
            className={css.search}
            prefix={<TbSearch />}
            value={search}
            placeholder={view === 'users' ? t('search.users') : t('search.roles')}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Spin spinning={loading}>
          <div className={`${css.tableWrap} ss-scroll`}>
            {view === 'users' ? (
              <StaffUsersTable
                users={filteredUsers}
                canApproveUsers={canApproveUsers}
                canManageUsers={canManageUsers}
                onSelectRole={openRoleSelection}
                onReject={(user) => {
                  setRejectTarget(user);
                  rejectForm.resetFields();
                }}
                onPermissions={openPermissions}
                onDisable={async (user) => {
                  await runAction(() => staffApi.disableUser(user.id), t('messages.userDisabled'));
                }}
                onEnable={async (user) => {
                  await runAction(() => staffApi.enableUser(user.id), t('messages.userEnabled'));
                }}
              />
            ) : (
              <StaffRolesTable
                roles={filteredRoles}
                canManageRoles={canManageRoles}
                onEdit={openEditRole}
                onDisable={async (role) => {
                  await runAction(() => staffApi.disableRole(role.id), t('messages.roleDisabled'));
                }}
                onEnable={async (role) => {
                  await runAction(() => staffApi.enableRole(role.id), t('messages.roleEnabled'));
                }}
              />
            )}
          </div>
        </Spin>
      </section>

      <StaffManagementModals
        actionLoading={actionLoading}
        roleTarget={roleTarget}
        roleAction={roleAction}
        roleSelectionForm={roleSelectionForm}
        rejectTarget={rejectTarget}
        rejectForm={rejectForm}
        permissionTarget={permissionTarget}
        permissionForm={permissionForm}
        roleModalOpen={roleModalOpen}
        editingRole={editingRole}
        roleForm={roleForm}
        roleOptions={roleOptions}
        permissionOptions={permissionOptions}
        onSubmitRoleSelection={submitRoleSelection}
        onSubmitReject={submitReject}
        onSubmitPermissions={submitPermissions}
        onSubmitRole={submitRole}
        onCloseRoleSelection={() => {
          setRoleTarget(null);
          roleSelectionForm.resetFields();
        }}
        onCloseReject={() => setRejectTarget(null)}
        onClosePermissions={() => setPermissionTarget(null)}
        onCloseRoleForm={() => {
          setRoleModalOpen(false);
          setEditingRole(null);
        }}
      />
    </div>
  );
}
