'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { App, Input, Select } from 'antd';
import {
  TbShoppingBag,
  TbToolsKitchen2,
  TbTable,
  TbCurrencyDram,
  TbSearch,
  TbRefresh,
} from 'react-icons/tb';
import { useOrders } from '@/context/OrdersContext';
import clientAPI from '@/api/api';
import type { OrderRecord } from '@/types/orders';
import css from './Orders.module.css';
import { useProfileData } from '@/context/ProfileDataContext';

function timeAgo(
  t: ReturnType<typeof useTranslations>,
  iso?: string,
): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return t('time.justNow');
  if (min < 60) return t('time.minAgo', { min });
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return t('time.hourAgo', { hrs });
  return t('time.dayAgo', { days: Math.floor(hrs / 24) });
}

const orderId = (o: OrderRecord, i: number) =>
  o._id ? `#${o._id.slice(-5).toUpperCase()}` : `#${1000 + i}`;

export default function Orders() {
  const t = useTranslations('orders');
  const { message } = App.useApp();
  const { orders, refreshOrders, markSeen } = useOrders();
  const { permissions } = useProfileData();
  const canViewRevenue = permissions.includes('revenue.view');
  const canManageOrders = permissions.includes('orders.manage');
  const [search, setSearch] = useState('');

  // Fetch the latest orders and clear the "new orders" badge on open.
  useEffect(() => {
    void refreshOrders();
    markSeen();
  }, [refreshOrders, markSeen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        String(o.table).toLowerCase().includes(q) ||
        o.items.some((it) => it.title.toLowerCase().includes(q)),
    );
  }, [orders, search]);

  const stats = useMemo(() => {
    const items = orders.reduce(
      (n, o) => n + o.items.reduce((s, it) => s + (it.count ?? 1), 0),
      0,
    );
    const tables = new Set(orders.map((o) => String(o.table))).size;
    const revenue = orders
      .filter((order) => order.status === 'completed')
      .reduce((sum, order) => sum + (order.allPrice ?? 0), 0);
    return { total: orders.length, items, tables, revenue };
  }, [orders]);

  const changeStatus = async (
    id: string,
    status: 'placed' | 'completed' | 'cancelled',
  ) => {
    try {
      await clientAPI.updateOrderStatus(id, status);
      await refreshOrders();
      message.success('Статус заказа обновлён');
    } catch {
      message.error('Не удалось обновить статус');
    }
  };

  const tiles = [
    { label: t('tiles.totalOrders'), value: stats.total, icon: TbShoppingBag, tone: 'primary' },
    { label: t('tiles.totalItems'), value: stats.items, icon: TbToolsKitchen2, tone: 'amber' },
    { label: t('tiles.tablesServed'), value: stats.tables, icon: TbTable, tone: 'green' },
    ...(canViewRevenue ? [{
      label: t('tiles.revenue'),
      value: `${stats.revenue.toLocaleString()} ֏`,
      icon: TbCurrencyDram,
      tone: 'violet',
    } as const] : []),
  ] as const;

  return (
    <div className={css.page}>
      <header className={css.header}>
        <div>
          <h1 className={css.title}>{t('title')}</h1>
          <p className={css.subtitle}>{t('subtitle')}</p>
        </div>
        <div className={css.headerActions}>
          <button
            type="button"
            className={css.btnGhost}
            onClick={() => void refreshOrders()}
          >
            <TbRefresh /> {t('refresh')}
          </button>
        </div>
      </header>

      <div className={css.stats}>
        {tiles.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={css.stat}>
            <div>
              <div className={css.statLabel}>{label}</div>
              <div className={css.statValue}>{value}</div>
            </div>
            <span className={`${css.statIcon} ${css[tone]}`}>
              <Icon />
            </span>
          </div>
        ))}
      </div>

      <div className={css.card}>
        <div className={css.toolbar}>
          <Input
            className={css.search}
            size="large"
            allowClear
            prefix={<TbSearch className={css.searchIcon} />}
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={`${css.tableWrap} ss-scroll`}>
          <table className={css.table}>
            <thead>
              <tr>
                <th>{t('columns.orderId')}</th>
                <th>{t('columns.table')}</th>
                <th>{t('columns.items')}</th>
                <th>{t('columns.time')}</th>
                <th>{t('columns.status')}</th>
                {canViewRevenue && (
                  <th className={css.right}>{t('columns.total')}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canViewRevenue ? 6 : 5} className={css.emptyRow}>
                    {t('empty')}
                  </td>
                </tr>
              ) : (
                filtered.map((o, i) => (
                  <tr key={o._id || i}>
                    <td className={css.mono}>{orderId(o, i)}</td>
                    <td>{t('table', { n: o.table })}</td>
                    <td className={css.items}>
                      {o.items.map((it) => it.title).join(', ') || '—'}
                    </td>
                    <td className={css.muted}>{timeAgo(t, o.createdAt)}</td>
                    <td>
                      {canManageOrders ? (
                        <Select
                          size="small"
                          value={o.status ?? 'placed'}
                          onChange={(status) =>
                            void changeStatus(o._id, status)
                          }
                          options={[
                            { value: 'placed', label: 'Принят' },
                            { value: 'completed', label: 'Завершён' },
                            { value: 'cancelled', label: 'Отменён' },
                          ]}
                        />
                      ) : (
                        o.status ?? 'placed'
                      )}
                    </td>
                    {canViewRevenue && (
                      <td className={`${css.right} ${css.total}`}>
                        {o.allPrice} {t('dramShort')}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
