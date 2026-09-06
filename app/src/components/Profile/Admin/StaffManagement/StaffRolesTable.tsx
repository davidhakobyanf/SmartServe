import { useTranslations } from 'next-intl';
import { Button, Empty, Popconfirm, Tag } from 'antd';
import { TbEdit } from 'react-icons/tb';
import type { StaffRole } from '@/types/staff';
import css from './StaffManagement.module.css';

interface StaffRolesTableProps {
  roles: StaffRole[];
  canManageRoles: boolean;
  onEdit: (role: StaffRole) => void;
  onDisable: (role: StaffRole) => Promise<void>;
  onEnable: (role: StaffRole) => Promise<void>;
}

export default function StaffRolesTable({ roles, canManageRoles, onEdit, onDisable, onEnable }: StaffRolesTableProps) {
  const t = useTranslations('staff');

  if (!roles.length) {
    return <Empty className={css.empty} description={t('empty.roles')} />;
  }

  return (
    <table className={css.table}>
      <thead><tr>
        <th>{t('columns.role')}</th>
        <th>{t('columns.code')}</th>
        <th>{t('columns.permissions')}</th>
        <th>{t('columns.status')}</th>
        <th className={css.actionsColumn}>{t('columns.actions')}</th>
      </tr></thead>
      <tbody>
        {roles.map((role) => (
          <tr key={role.id}>
            <td data-label={t('columns.role')}><strong>{role.name}</strong>{role.isSystem && <Tag className={css.systemTag}>{t('system')}</Tag>}</td>
            <td data-label={t('columns.code')}><code className={css.code}>{role.code}</code></td>
            <td data-label={t('columns.permissions')}>{t('permissionCount', { count: role.permissions.length })}</td>
            <td data-label={t('columns.status')}><Tag color={role.isActive ? 'green' : 'default'}>{role.isActive ? t('statuses.active') : t('statuses.disabled')}</Tag></td>
            <td data-label={t('columns.actions')}>
              <div className={css.actions}>
                {canManageRoles && !role.isSystem && (
                  <>
                    <Button size="small" icon={<TbEdit />} onClick={() => onEdit(role)}>{t('actions.edit')}</Button>
                    {role.isActive ? (
                      <Popconfirm title={t('confirm.disableRole')} okText={t('common.confirm')} cancelText={t('common.cancel')} onConfirm={() => void onDisable(role)}>
                        <Button size="small" danger>{t('actions.disable')}</Button>
                      </Popconfirm>
                    ) : (
                      <Button size="small" onClick={() => void onEnable(role)}>{t('actions.enable')}</Button>
                    )}
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
