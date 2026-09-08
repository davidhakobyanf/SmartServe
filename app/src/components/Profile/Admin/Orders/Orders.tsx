'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { App, Input, Select } from 'antd';
import {
  TbShoppingBag,
  TbToolsKitchen2,
  TbTable,
  TbCurrencyDram,
  TbSearch,
  TbRefresh,
  TbClock,
  TbArrowRight,
  TbChefHat,
} from 'react-icons/tb';
import { useOrders } from '@/context/OrdersContext';
import clientAPI from '@/api/api';
import type { OrderRecord } from '@/types/orders';
import type { OrderStatus } from '@/types/restaurant';
import css from './Orders.module.css';
import { useProfileData } from '@/context/ProfileDataContext';
import PageHeader from '@/components/Common/PageHeader/PageHeader';
import { formatAmount } from '@/lib/formatters';

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

const FILTERS = ['active', 'placed', 'preparing', 'ready', 'history', 'all'] as const;
type OrderFilter = (typeof FILTERS)[number];
const STATUSES: OrderStatus[] = ['placed', 'preparing', 'ready', 'completed', 'cancelled'];
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: 'preparing', preparing: 'ready', ready: 'completed',
};
const matchesFilter = (order: OrderRecord, filter: OrderFilter) => {
  const status = order.status ?? 'placed';
  const archived = status === 'completed' || status === 'cancelled';
  return filter === 'all' || (filter === 'active' ? !archived : filter === 'history' ? archived : status === filter);
};

export default function Orders() {
  const t = useTranslations('orders');
  const locale = useLocale();
  const { message } = App.useApp();
  const { orders, refreshOrders, markSeen, isConnected } = useOrders();
  const { permissions } = useProfileData();
  const canViewRevenue = permissions.includes('revenue.view');
  const canManageOrders = permissions.includes('orders.manage');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OrderFilter>('active');
  const [pending, setPending] = useState<Set<string>>(new Set());
  const pendingRef = useRef(new Set<string>());
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [, setClock] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setClock((value) => value + 1), 30000);
    return () => window.clearInterval(timer);
  }, []);

  // Fetch the latest orders and clear the "new orders" badge on open.
  useEffect(() => {
    void refreshOrders().catch(() => setLoadError(true));
    markSeen();
  }, [refreshOrders, markSeen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^#/, '');
    const result = orders.filter((order) => matchesFilter(order, filter)).filter(
      (o) =>
        o._id.toLowerCase().includes(q) ||
        String(o.table).toLowerCase().includes(q) ||
        o.items.some((it) => it.title.toLowerCase().includes(q) || it.sauces?.some((sauce) => sauce.name.toLowerCase().includes(q))),
    );
    const timestamp = (order: OrderRecord) => Date.parse(order.createdAt ?? '') || 0;
    return result.sort((a, b) => {
      if (filter === 'history') return timestamp(b) - timestamp(a);
      const aArchived = matchesFilter(a, 'history');
      const bArchived = matchesFilter(b, 'history');
      if (aArchived !== bArchived) return Number(aArchived) - Number(bArchived);
      return aArchived ? timestamp(b) - timestamp(a) : timestamp(a) - timestamp(b);
    });
  }, [orders, search, filter]);

  const filterCounts = useMemo(() => Object.fromEntries(
    FILTERS.map((key) => [key, orders.filter((order) => matchesFilter(order, key)).length]),
  ), [orders]);

  const reload = async () => {
    setRefreshing(true);
    try { await refreshOrders(); setLoadError(false); }
    catch { setLoadError(true); }
    finally { setRefreshing(false); }
  };

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
    status: OrderStatus,
  ) => {
    if (pendingRef.current.has(id)) return;
    pendingRef.current.add(id);
    setPending(new Set(pendingRef.current));
    try {
      await clientAPI.updateOrderStatus(id, status);
      message.success(t('statusUpdateSuccess'));
      await refreshOrders().catch(() => setLoadError(true));
    } catch {
      message.error(t('statusUpdateError'));
    } finally {
      pendingRef.current.delete(id);
      setPending(new Set(pendingRef.current));
    }
  };

  const tiles = [
    { label: t('tiles.totalOrders'), value: stats.total, icon: TbShoppingBag, tone: 'primary' },
    { label: t('tiles.totalItems'), value: stats.items, icon: TbToolsKitchen2, tone: 'amber' },
    { label: t('tiles.tablesServed'), value: stats.tables, icon: TbTable, tone: 'green' },
    ...(canViewRevenue ? [{
      label: t('tiles.revenue'),
      value: `${formatAmount(stats.revenue)} ֏`,
      icon: TbCurrencyDram,
      tone: 'violet',
    } as const] : []),
  ] as const;

  return (
    <div className={css.page}>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <button
            type="button"
            className={css.btnGhost}
            onClick={() => void reload()}
            disabled={refreshing}
          >
            <TbRefresh /> {t('refresh')}
          </button>
        }
      />

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

      <section className={css.board} aria-label={t('board.title')}>
        <div className={css.toolbar}>
          <div className={css.boardHeading}>
            <h2><TbChefHat /> {t('board.title')}</h2>
            <span className={css.connection} data-connected={isConnected} role="status">
              <span aria-hidden="true" /> {t(isConnected ? 'board.live' : 'board.offline')}
            </span>
          </div>
          <div className={css.filters} role="group" aria-label={t('board.filterLabel')}>
            {FILTERS.map((key) => (
              <button key={key} type="button" aria-pressed={filter === key}
                className={css.filterButton} onClick={() => setFilter(key)}>
                {t(`board.filters.${key}`)} <span>{filterCounts[key]}</span>
              </button>
            ))}
          </div>
          <div className={css.searchRow}>
          <Input
            className={css.search}
            size="large"
            allowClear
            prefix={<TbSearch className={css.searchIcon} />}
            placeholder={t('board.search')}
            aria-label={t('board.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className={css.sortHint}>{t(filter === 'history' ? 'board.newestFirst' : 'board.oldestFirst')}</span>
          </div>
        </div>
        {loadError && <p role="alert" className={css.error}>{t('board.loadError')}</p>}
        <div className={css.resultSummary} role="status">{t('board.showing', { count: filtered.length, total: orders.length })}</div>
        {filtered.length === 0 ? (
          <div className={css.emptyState}>
            <TbChefHat aria-hidden="true" />
            <h3>{t(search.trim() ? 'board.noMatches' : filter === 'active' ? 'board.noActive' : 'empty')}</h3>
            <p>{t('board.emptyHint')}</p>
            {(filter !== 'all' || search) && <button className={css.btnGhost} type="button" onClick={() => { setFilter('all'); setSearch(''); }}>{t('board.showAll')}</button>}
          </div>
        ) : <div className={css.orderGrid}>
          {filtered.map((order, index) => {
            const status = order.status ?? 'placed';
            const next = NEXT_STATUS[status];
            const busy = pending.has(order._id);
            const id = orderId(order, index);
            return (
              <article key={order._id} className={css.ticket} data-status={status} aria-label={`${t('table', { n: order.table })}, ${id}`}>
                <header className={css.ticketHeader}>
                  <div className={css.ticketIdentity}>
                    <h3>{t('table', { n: order.table })}</h3>
                    <span className={css.orderId}>{id}</span>
                  </div>
                  <span className={css.statusBadge}>{t(`statuses.${status}`)}</span>
                  <div className={css.ticketTime}><TbClock aria-hidden="true" />
                    <span>{timeAgo(t, order.createdAt)}</span>
                    {order.createdAt && <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString(locale === 'am' ? 'hy-AM' : locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>}
                  </div>
                </header>
                <ul className={css.dishes}>
                  {order.items.map((item, itemIndex) => <li key={`${item.id}-${itemIndex}`}>
                    <span className={css.quantity} aria-label={t('modal.pieces', { count: item.count ?? 1 })}>{item.count ?? 1}×</span>
                    <div className={css.dishText}><strong>{item.title}</strong>
                      {Boolean(item.sauces?.length) && <p className={css.additions}>{t('board.additions')}: {item.sauces.map((sauce) => sauce.name).join(', ')}</p>}
                    </div>
                  </li>)}
                </ul>
                <footer className={css.ticketFooter}>
                  <div className={css.ticketTotals}>
                    <span>{t('board.dishCount', { count: order.items.reduce((sum, item) => sum + (item.count ?? 1), 0) })}</span>
                    {canViewRevenue && <strong>{formatAmount(order.allPrice)} {t('dramShort')}</strong>}
                  </div>
                  {canManageOrders && <div className={css.actions}>
                    {next && <button type="button" className={css.nextButton} disabled={busy} onClick={() => void changeStatus(order._id, next)}>
                      {t(busy ? 'board.saving' : `board.actions.${next}`)} <TbArrowRight aria-hidden="true" />
                    </button>}
                    <label className={css.statusControl}>
                      <span>{t('columns.status')}</span>
                      <Select value={status} disabled={busy} loading={busy}
                        aria-label={`${t('columns.status')} ${id}`}
                        onChange={(value) => void changeStatus(order._id, value)}
                        options={STATUSES.map((value) => ({ value, label: t(`statuses.${value}`) }))} />
                    </label>
                  </div>}
                </footer>
              </article>
            );
          })}
        </div>}
      </section>
    </div>
  );
}
