'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input, Popconfirm, message } from 'antd';
import {
  TbShoppingBag,
  TbToolsKitchen2,
  TbTable,
  TbCurrencyDram,
  TbSearch,
  TbRefresh,
  TbTrash,
} from 'react-icons/tb';
import { useOrders } from '@/context/OrdersContext';
import clientAPI from '@/api/api';
import type { OrderRecord } from '@/types/orders';
import css from './Orders.module.css';

function timeAgo(iso?: string): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return `${Math.floor(hrs / 24)} d ago`;
}

const orderId = (o: OrderRecord, i: number) =>
  o._id ? `#${o._id.slice(-5).toUpperCase()}` : `#${1000 + i}`;

export default function Orders() {
  const { orders, refreshOrders, markSeen } = useOrders();
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
    const revenue = orders.reduce((s, o) => s + (o.allPrice ?? 0), 0);
    return { total: orders.length, items, tables, revenue };
  }, [orders]);

  const clearAll = async () => {
    try {
      await clientAPI.deleteAllOrders();
      await refreshOrders();
      message.success('Բոլոր պատվերները ջնջվեցին');
    } catch {
      message.error('Չհաջողվեց ջնջել');
    }
  };

  const tiles = [
    { label: 'Total Orders', value: stats.total, icon: TbShoppingBag, tone: 'primary' },
    { label: 'Total Items', value: stats.items, icon: TbToolsKitchen2, tone: 'amber' },
    { label: 'Tables Served', value: stats.tables, icon: TbTable, tone: 'green' },
    {
      label: 'Revenue',
      value: `${stats.revenue.toLocaleString()} ֏`,
      icon: TbCurrencyDram,
      tone: 'violet',
    },
  ] as const;

  return (
    <div className={css.page}>
      <header className={css.header}>
        <div>
          <h1 className={css.title}>Orders</h1>
          <p className={css.subtitle}>Real-time order management and analytics</p>
        </div>
        <div className={css.headerActions}>
          <button
            type="button"
            className={css.btnGhost}
            onClick={() => void refreshOrders()}
          >
            <TbRefresh /> Refresh
          </button>
          {orders.length > 0 && (
            <Popconfirm
              title="Ջնջե՞լ բոլոր պատվերները"
              okText="Այո"
              cancelText="Ոչ"
              onConfirm={() => void clearAll()}
            >
              <button type="button" className={css.btnDanger}>
                <TbTrash /> Clear all
              </button>
            </Popconfirm>
          )}
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
            placeholder="Search by table or item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={`${css.tableWrap} ss-scroll`}>
          <table className={css.table}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Table</th>
                <th>Items</th>
                <th>Time</th>
                <th>Status</th>
                <th className={css.right}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className={css.emptyRow}>
                    Դեռ պատվերներ չկան
                  </td>
                </tr>
              ) : (
                filtered.map((o, i) => (
                  <tr key={o._id || i}>
                    <td className={css.mono}>{orderId(o, i)}</td>
                    <td>Table {o.table}</td>
                    <td className={css.items}>
                      {o.items.map((it) => it.title).join(', ') || '—'}
                    </td>
                    <td className={css.muted}>{timeAgo(o.createdAt)}</td>
                    <td>
                      <span className={css.badge}>Placed</span>
                    </td>
                    <td className={`${css.right} ${css.total}`}>
                      {o.allPrice} դր.
                    </td>
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
