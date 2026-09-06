import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Button, Empty, Popconfirm, Tag } from 'antd';
import { TbEdit, TbKey, TbUserOff } from 'react-icons/tb';
import type { StaffUser } from '@/types/staff';
import { formatDate } from '@/lib/formatters';
import css from './StaffManagement.module.css';

export type StaffActionRunner = (
  action: () => Promise<void>,
  successMessage: string,
) => Promise<boolean>;

interface StaffUsersTableProps {
  users: StaffUser[];
  canApproveUsers: boolean;
  canManageUsers: boolean;
  onSelectRole: (user: StaffUser, action: 'approve' | 'change') => void;
  onReject: (user: StaffUser) => void;
  onPermissions: (user: StaffUser) => void;
  onDisable: (user: StaffUser) => Promise<void>;
  onEnable: (user: StaffUser) => Promise<void>;
}

const statusColor: Record<StaffUser['status'], string> = {
  pending: 'gold',
  active: 'green',
  rejected: 'red',
  disabled: 'default',
};

export default function StaffUsersTable({
  users,
  canApproveUsers,
  canManageUsers,
  onSelectRole,
  onReject,
  onPermissions,
  onDisable,
  onEnable,
}: StaffUsersTableProps) {
  const t = useTranslations('staff');
  const { locale } = useParams<{ locale: string }>();

  if (!users.length) {
    return <Empty className={css.empty} description={t('empty.users')} />;
  }

  return (
    <table className={css.table}>
      <thead><tr>
        <th>{t('columns.employee')}</th>
        <th>{t('columns.status')}</th>
        <th>{t('columns.role')}</th>
        <th>{t('columns.registered')}</th>
        <th className={css.actionsColumn}>{t('columns.actions')}</th>
      </tr></thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td data-label={t('columns.employee')}>
              <div className={css.person}>
                <span className={css.avatar}>{(user.name[0] ?? '') + (user.surname[0] ?? '')}</span>
                <div><strong>{user.name} {user.surname}</strong><span>{user.email}</span></div>
              </div>
            </td>
            <td data-label={t('columns.status')}><Tag color={statusColor[user.status]}>{t(`statuses.${user.status}`)}</Tag></td>
            <td data-label={t('columns.role')}>{user.role?.name ?? <span className={css.muted}>{t('noRole')}</span>}</td>
            <td data-label={t('columns.registered')} className={css.muted}>{formatDate(user.createdAt, locale)}</td>
            <td data-label={t('columns.actions')}>
              <div className={css.actions}>
                {canApproveUsers && user.status === 'pending' && (
                  <>
                    <Button size="small" type="primary" onClick={() => onSelectRole(user, 'approve')}>{t('actions.approve')}</Button>
                    <Button size="small" danger onClick={() => onReject(user)}>{t('actions.reject')}</Button>
                  </>
                )}
                {canManageUsers && (user.status === 'active' || user.status === 'disabled') && (
                  <>
                    <Button size="small" icon={<TbEdit />} onClick={() => onSelectRole(user, 'change')}>{t('actions.role')}</Button>
                    <Button size="small" icon={<TbKey />} onClick={() => onPermissions(user)}>{t('actions.permissions')}</Button>
                    {user.status === 'active' ? (
                      <Popconfirm title={t('confirm.disableUser')} okText={t('common.confirm')} cancelText={t('common.cancel')} onConfirm={() => void onDisable(user)}>
                        <Button size="small" danger icon={<TbUserOff />}>{t('actions.disable')}</Button>
                      </Popconfirm>
                    ) : (
                      <Button size="small" onClick={() => void onEnable(user)}>{t('actions.enable')}</Button>
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
