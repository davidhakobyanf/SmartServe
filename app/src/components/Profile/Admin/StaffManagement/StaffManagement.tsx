'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  App,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Tag,
} from 'antd';
import {
  TbEdit,
  TbKey,
  TbPlus,
  TbRefresh,
  TbSearch,
  TbShieldCheck,
  TbUserCheck,
  TbUserOff,
  TbUsers,
} from 'react-icons/tb';
import staffApi from '@/api/staffApi';
import {
  PERMISSIONS,
  type Permission,
  type StaffRole,
  type StaffUser,
} from '@/types/staff';
import css from './StaffManagement.module.css';
import { useProfileData } from '@/context/ProfileDataContext';
import LocalizedTextFields from '@/components/Common/LocalizedTextFields';
import {
  cleanLocalizedText,
  hasLocalizedText,
  missingContentLocales,
  type LocalizedText,
} from '@/types/localization';
import { toIntlLocale } from '@/lib/intlLocale';

type View = 'users' | 'roles';
type RoleAction = 'approve' | 'change';

interface RoleSelectionValues {
  roleId: string;
}

interface RejectValues {
  reason: string;
}

interface PermissionValues {
  permissionAllow: Permission[];
  permissionDeny: Permission[];
}

interface RoleFormValues {
  nameTranslations?: LocalizedText;
  code?: string;
  permissions: Permission[];
}

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

function getApiError(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data as
    | { message?: string | string[]; error?: string }
    | undefined;
  const detail = data?.message ?? data?.error;

  return Array.isArray(detail) ? detail.join(', ') : detail || fallback;
}

function formatDate(value: string | null, locale: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(toIntlLocale(locale));
}

export default function StaffManagement() {
  const t = useTranslations('staff');
  const commonT = useTranslations('common');
  const { locale } = useParams<{ locale: string }>();
  const { message } = App.useApp();
  const { permissions } = useProfileData();
  const canViewUsers = permissions.includes('users.view');
  const canApproveUsers = permissions.includes('users.approve');
  const canManageUsers = permissions.includes('users.manage');
  const canManageRoles = permissions.includes('roles.manage');
  const [view, setView] = useState<View>('users');
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
      const apiMessage = getApiError(error, fallback);
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

  const statusColor: Record<StaffUser['status'], string> = {
    pending: 'gold',
    active: 'green',
    rejected: 'red',
    disabled: 'default',
  };

  return (
    <div className={css.page}>
      <header className={css.header}>
        <div>
          <h1 className={css.title}>{t('title')}</h1>
          <p className={css.subtitle}>{t('subtitle')}</p>
        </div>
        <div className={css.headerActions}>
          {view === 'roles' && canManageRoles && (
            <Button type="primary" icon={<TbPlus />} onClick={openCreateRole}>
              {t('actions.createRole')}
            </Button>
          )}
          <Button icon={<TbRefresh />} onClick={() => void loadData()}>
            {t('actions.refresh')}
          </Button>
        </div>
      </header>

      <section className={css.stats}>
        <div className={css.stat}>
          <span className={`${css.statIcon} ${css.primary}`}><TbUsers /></span>
          <div><strong>{stats.total}</strong><span>{t('stats.total')}</span></div>
        </div>
        <div className={css.stat}>
          <span className={`${css.statIcon} ${css.amber}`}><TbUserCheck /></span>
          <div><strong>{stats.pending}</strong><span>{t('stats.pending')}</span></div>
        </div>
        <div className={css.stat}>
          <span className={`${css.statIcon} ${css.green}`}><TbShieldCheck /></span>
          <div><strong>{stats.active}</strong><span>{t('stats.active')}</span></div>
        </div>
        <div className={css.stat}>
          <span className={`${css.statIcon} ${css.violet}`}><TbKey /></span>
          <div><strong>{stats.roles}</strong><span>{t('stats.roles')}</span></div>
        </div>
      </section>

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
              filteredUsers.length ? (
                <table className={css.table}>
                  <thead><tr>
                    <th>{t('columns.employee')}</th>
                    <th>{t('columns.status')}</th>
                    <th>{t('columns.role')}</th>
                    <th>{t('columns.registered')}</th>
                    <th className={css.actionsColumn}>{t('columns.actions')}</th>
                  </tr></thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className={css.person}>
                            <span className={css.avatar}>
                              {(user.name[0] ?? '') + (user.surname[0] ?? '')}
                            </span>
                            <div><strong>{user.name} {user.surname}</strong><span>{user.email}</span></div>
                          </div>
                        </td>
                        <td><Tag color={statusColor[user.status]}>{t(`statuses.${user.status}`)}</Tag></td>
                        <td>{user.role?.name ?? <span className={css.muted}>{t('noRole')}</span>}</td>
                        <td className={css.muted}>{formatDate(user.createdAt, locale)}</td>
                        <td>
                          <div className={css.actions}>
                            {canApproveUsers && user.status === 'pending' && (
                              <>
                                <Button size="small" type="primary" onClick={() => openRoleSelection(user, 'approve')}>
                                  {t('actions.approve')}
                                </Button>
                                <Button size="small" danger onClick={() => { setRejectTarget(user); rejectForm.resetFields(); }}>
                                  {t('actions.reject')}
                                </Button>
                              </>
                            )}
                            {canManageUsers && (user.status === 'active' || user.status === 'disabled') && (
                              <>
                                <Button size="small" icon={<TbEdit />} onClick={() => openRoleSelection(user, 'change')}>
                                  {t('actions.role')}
                                </Button>
                                <Button size="small" icon={<TbKey />} onClick={() => openPermissions(user)}>
                                  {t('actions.permissions')}
                                </Button>
                                {user.status === 'active' ? (
                                  <Popconfirm
                                    title={t('confirm.disableUser')}
                                    okText={t('common.confirm')}
                                    cancelText={t('common.cancel')}
                                    onConfirm={() => void runAction(() => staffApi.disableUser(user.id), t('messages.userDisabled'))}
                                  >
                                    <Button size="small" danger icon={<TbUserOff />}>{t('actions.disable')}</Button>
                                  </Popconfirm>
                                ) : (
                                  <Button
                                    size="small"
                                    onClick={() => void runAction(() => staffApi.enableUser(user.id), t('messages.userEnabled'))}
                                  >
                                    {t('actions.enable')}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <Empty className={css.empty} description={t('empty.users')} />
            ) : filteredRoles.length ? (
              <table className={css.table}>
                <thead><tr>
                  <th>{t('columns.role')}</th>
                  <th>{t('columns.code')}</th>
                  <th>{t('columns.permissions')}</th>
                  <th>{t('columns.status')}</th>
                  <th className={css.actionsColumn}>{t('columns.actions')}</th>
                </tr></thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr key={role.id}>
                      <td><strong>{role.name}</strong>{role.isSystem && <Tag className={css.systemTag}>{t('system')}</Tag>}</td>
                      <td><code className={css.code}>{role.code}</code></td>
                      <td>{t('permissionCount', { count: role.permissions.length })}</td>
                      <td><Tag color={role.isActive ? 'green' : 'default'}>{role.isActive ? t('statuses.active') : t('statuses.disabled')}</Tag></td>
                      <td>
                        <div className={css.actions}>
                          {canManageRoles && !role.isSystem && (
                            <>
                              <Button size="small" icon={<TbEdit />} onClick={() => openEditRole(role)}>{t('actions.edit')}</Button>
                              {role.isActive ? (
                                <Popconfirm
                                  title={t('confirm.disableRole')}
                                  okText={t('common.confirm')}
                                  cancelText={t('common.cancel')}
                                  onConfirm={() => void runAction(() => staffApi.disableRole(role.id), t('messages.roleDisabled'))}
                                >
                                  <Button size="small" danger>{t('actions.disable')}</Button>
                                </Popconfirm>
                              ) : (
                                <Button size="small" onClick={() => void runAction(() => staffApi.enableRole(role.id), t('messages.roleEnabled'))}>
                                  {t('actions.enable')}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <Empty className={css.empty} description={t('empty.roles')} />}
          </div>
        </Spin>
      </section>

      <Modal
        open={Boolean(roleTarget)}
        title={roleAction === 'approve' ? t('modals.approveTitle') : t('modals.changeRoleTitle')}
        okText={roleAction === 'approve' ? t('actions.approve') : t('common.save')}
        cancelText={t('common.cancel')}
        confirmLoading={actionLoading}
        onOk={() => roleSelectionForm.submit()}
        onCancel={() => {
          setRoleTarget(null);
          roleSelectionForm.resetFields();
        }}
      >
        <Form form={roleSelectionForm} layout="vertical" onFinish={(values) => void submitRoleSelection(values)}>
          <p className={css.modalHint}>{roleTarget?.name} {roleTarget?.surname}</p>
          <Form.Item name="roleId" label={t('modals.roleLabel')} rules={[{ required: true, message: t('validation.role') }]}> 
            <Select options={roleOptions} placeholder={t('modals.rolePlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={Boolean(rejectTarget)}
        title={t('modals.rejectTitle')}
        okText={t('actions.reject')}
        okButtonProps={{ danger: true }}
        cancelText={t('common.cancel')}
        confirmLoading={actionLoading}
        onOk={() => rejectForm.submit()}
        onCancel={() => setRejectTarget(null)}
      >
        <Form form={rejectForm} layout="vertical" onFinish={(values) => void submitReject(values)}>
          <Form.Item
            name="reason"
            label={t('modals.reasonLabel')}
            rules={[{ required: true, min: 3, message: t('validation.reason') }]}
          >
            <Input.TextArea rows={4} placeholder={t('modals.reasonPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        width={680}
        open={Boolean(permissionTarget)}
        title={t('modals.permissionsTitle')}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        confirmLoading={actionLoading}
        onOk={() => permissionForm.submit()}
        onCancel={() => setPermissionTarget(null)}
      >
        <p className={css.modalHint}>{t('modals.permissionsHint')}</p>
        <Form form={permissionForm} layout="vertical" onFinish={(values) => void submitPermissions(values)}>
          <Form.Item name="permissionAllow" label={t('modals.allowLabel')}>
            <Select mode="multiple" options={permissionOptions} placeholder={t('modals.permissionsPlaceholder')} />
          </Form.Item>
          <Form.Item name="permissionDeny" label={t('modals.denyLabel')}>
            <Select mode="multiple" options={permissionOptions} placeholder={t('modals.permissionsPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        width={680}
        open={roleModalOpen}
        title={editingRole ? t('modals.editRoleTitle') : t('modals.createRoleTitle')}
        okText={editingRole ? t('common.save') : t('common.create')}
        cancelText={t('common.cancel')}
        confirmLoading={actionLoading}
        onOk={() => roleForm.submit()}
        onCancel={() => { setRoleModalOpen(false); setEditingRole(null); }}
      >
        <Form form={roleForm} layout="vertical" onFinish={(values) => void submitRole(values)}>
          <LocalizedTextFields
            name="nameTranslations"
            label={t('modals.nameLabel')}
            placeholder={t('modals.namePlaceholder')}
            maxLength={100}
            required
          />
          {!editingRole && (
            <Form.Item
              name="code"
              label={t('modals.codeLabel')}
              rules={[
                { required: true, message: t('validation.code') },
                { pattern: /^[a-z][a-z0-9_]*$/, message: t('validation.codePattern') },
              ]}
            >
              <Input placeholder={t('modals.codePlaceholder')} />
            </Form.Item>
          )}
          <Form.Item name="permissions" label={t('modals.rolePermissionsLabel')}>
            <Select mode="multiple" options={permissionOptions} placeholder={t('modals.permissionsPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
