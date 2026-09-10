'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Spin } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import {
  TbAlertTriangle,
  TbBellRinging,
  TbChartBar,
  TbChefHat,
  TbClock,
  TbCurrencyDram,
  TbLayoutDashboard,
  TbPackage,
  TbRefresh,
  TbShoppingBag,
  TbTable,
  TbToolsKitchen2,
} from 'react-icons/tb';
import PageHeader from '@/components/Common/PageHeader/PageHeader';
import { useMenuConnection } from '@/hooks/useMenuConnection';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useOrders } from '@/context/OrdersContext';
import { useTables } from '@/context/TablesContext';
import { useWaiterCalls } from '@/context/WaiterCallsContext';
import { useProfileData } from '@/context/ProfileDataContext';
import { useVenueSettings } from '@/context/VenueSettingsContext';
import { Link } from '@/i18n/navigation';
import { formatAmount, formatDateTime } from '@/lib/formatters';
import type { DashboardPeriod } from '@/types/dashboard';
import type { OrderStatus } from '@/types/restaurant';
import css from './DashboardPage.module.css';

const PERIODS: DashboardPeriod[] = ['today', '7d', '30d'];

function ageLabel(t: ReturnType<typeof useTranslations>, minutes: number) {
  if (minutes < 1) return t('time.justNow');
  if (minutes < 60) return t('time.minutes', { count: minutes });
  return t('time.hours', { count: Math.floor(minutes / 60) });
}

function bucketLabel(bucket: string, period: DashboardPeriod, locale: string) {
  if (period === 'today') return bucket.slice(11, 16);
  const [year, month, day] = bucket.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat(locale === 'am' ? 'hy-AM' : locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}

export default function ProfileDashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { permissions, isLoading: profileLoading } = useProfileData();
  const { settings } = useVenueSettings();
  const { calls } = useWaiterCalls();
  const {
    ready: ordersReady,
    revision: ordersRevision,
    isConnected: ordersConnected,
  } = useOrders();
  const { ready: tablesReady, revision: tablesRevision } = useTables();
  const canViewOrders = permissions.includes('orders.view');
  const canViewRevenue = canViewOrders && permissions.includes('revenue.view');
  const canViewTables = permissions.includes('tables.view');
  const canViewMenu = permissions.includes('menu.view');
  const canViewWaiterCalls = permissions.includes('waiter_calls.view');
  const { ready: menuReady, revision: menuRevision } = useMenuConnection(canViewMenu);
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const connectionsReady =
    (!canViewOrders || ordersReady) &&
    (!canViewTables || tablesReady) &&
    (!canViewMenu || menuReady);
  const dashboard = useDashboardData(
    period,
    !profileLoading && connectionsReady,
  );
  const data = dashboard.data;
  const initialLoading = profileLoading || !connectionsReady || (dashboard.loading && !data);
  const revisionKey = `${ordersRevision}:${tablesRevision}:${menuRevision}`;
  const lastRevision = useRef(revisionKey);

  useEffect(() => {
    if (lastRevision.current !== revisionKey && data) dashboard.invalidate();
    lastRevision.current = revisionKey;
  }, [data, dashboard, revisionKey]);

  const delayedOrders = useMemo(
    () => data?.recentOrders.filter(order => order.ageMinutes >= 10) ?? [],
    [data?.recentOrders],
  );
  const attentionCount =
    delayedOrders.length +
    (canViewMenu ? data?.lowStock.length ?? 0 : 0) +
    (canViewWaiterCalls ? calls.length : 0);
  const maxOrders = Math.max(1, ...(data?.series.map(point => point.orders) ?? [0]));
  const maxProductQuantity = Math.max(
    1,
    ...(data?.topProducts.map(product => product.quantity) ?? [0]),
  );

  const metrics = data
    ? [
        ...(canViewOrders
          ? [
              {
                key: 'orders',
                label: t('metrics.orders', { period: t(`periods.${period}`) }),
                value: data.metrics.orders ?? 0,
                icon: TbShoppingBag,
                tone: 'primary',
              },
              {
                key: 'activeOrders',
                label: t('metrics.activeOrders'),
                value: data.metrics.activeOrders ?? 0,
                icon: TbToolsKitchen2,
                tone: 'amber',
              },
            ]
          : []),
        ...(canViewTables
          ? [
              {
                key: 'tables',
                label: t('metrics.occupiedTables'),
                value: `${data.metrics.occupiedTables ?? 0}/${data.metrics.totalTables ?? 0}`,
                icon: TbTable,
                tone: 'green',
              },
            ]
          : []),
        ...(canViewRevenue
          ? [
              {
                key: 'revenue',
                label: t('metrics.revenue', { period: t(`periods.${period}`) }),
                value: `${formatAmount(data.metrics.revenue ?? 0)} ${settings.currency}`,
                icon: TbCurrencyDram,
                tone: 'violet',
              },
            ]
          : []),
      ]
    : [];

  return (
    <div className={css.page}>
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        actions={
          <div className={css.headerActions}>
            <div className={css.periods} role="group" aria-label={t('periodLabel')}>
              {PERIODS.map(value => (
                <button
                  key={value}
                  type="button"
                  className={period === value ? css.periodActive : ''}
                  aria-pressed={period === value}
                  onClick={() => setPeriod(value)}
                >
                  {t(`periods.${value}`)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={css.refreshButton}
              disabled={dashboard.loading || initialLoading}
              onClick={() => void dashboard.refresh()}
            >
              <TbRefresh /> {t('refresh')}
            </button>
          </div>
        }
      />

      {initialLoading ? (
        <div className={css.loading}>
          <Spin size="large" />
          <span>{t('loading')}</span>
        </div>
      ) : dashboard.error && !data ? (
        <Alert
          type="error"
          showIcon
          message={t('loadError')}
          action={<button className={css.retryButton} onClick={() => void dashboard.refresh()}>{t('retry')}</button>}
        />
      ) : data ? (
        <>
          <section className={css.metrics} aria-label={t('metrics.title')}>
            {metrics.map(({ key, label, value, icon: Icon, tone }) => (
              <article key={key} className={css.metric}>
                <div>
                  <span className={css.metricLabel}>{label}</span>
                  <strong className={css.metricValue}>{value}</strong>
                </div>
                <span className={`${css.metricIcon} ${css[tone]}`}><Icon /></span>
              </article>
            ))}
          </section>

          {dashboard.error && <Alert type="warning" showIcon message={t('refreshError')} />}

          <div className={css.topGrid}>
            <section className={css.panel}>
              <header className={css.panelHeader}>
                <div>
                  <h2><TbAlertTriangle /> {t('attention.title')}</h2>
                  <p>{t('attention.subtitle')}</p>
                </div>
                <span className={attentionCount ? css.countAlert : css.countOk}>{attentionCount}</span>
              </header>
              {attentionCount === 0 ? (
                <div className={css.allClear}>
                  <TbChefHat />
                  <div><strong>{t('attention.allClear')}</strong><span>{t('attention.allClearHint')}</span></div>
                </div>
              ) : (
                <div className={css.attentionList}>
                  {canViewWaiterCalls && calls.slice(0, 3).map(call => (
                    <Link key={call.id} href="/profile/waiter" className={css.attentionItem}>
                      <span className={`${css.attentionIcon} ${css.danger}`}><TbBellRinging /></span>
                      <div><strong>{t('attention.waiter', { table: call.table })}</strong><span>{t('attention.waiterHint')}</span></div>
                      <TbClock />
                    </Link>
                  ))}
                  {delayedOrders.slice(0, 3).map(order => (
                    <Link key={order.id} href="/profile/orders" className={css.attentionItem}>
                      <span className={`${css.attentionIcon} ${css.warning}`}><TbClock /></span>
                      <div><strong>{t('attention.delayedOrder', { table: order.tableNumber })}</strong><span>{ageLabel(t, order.ageMinutes)}</span></div>
                      <TbToolsKitchen2 />
                    </Link>
                  ))}
                  {canViewMenu && data.lowStock.slice(0, 3).map(product => (
                    <Link key={product.id} href="/profile/menu" className={css.attentionItem}>
                      <span className={`${css.attentionIcon} ${css.stock}`}><TbPackage /></span>
                      <div><strong>{product.title}</strong><span>{t('attention.lowStock', { count: product.stockQuantity })}</span></div>
                      <TbAlertTriangle />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className={css.panel}>
              <header className={css.panelHeader}>
                <div><h2><TbLayoutDashboard /> {t('quickActions.title')}</h2><p>{t('quickActions.subtitle')}</p></div>
              </header>
              <div className={css.quickActions}>
                {canViewOrders && <Link href="/profile/orders"><TbShoppingBag /><span>{t('quickActions.orders')}</span></Link>}
                {canViewMenu && <Link href="/profile/menu"><TbChefHat /><span>{t('quickActions.menu')}</span></Link>}
                {canViewTables && <Link href="/profile/tables"><TbTable /><span>{t('quickActions.tables')}</span></Link>}
                {canViewWaiterCalls && <Link href="/profile/waiter"><TbBellRinging /><span>{t('quickActions.waiter')}</span></Link>}
              </div>
            </section>
          </div>

          {canViewOrders && (
            <section className={`${css.panel} ${css.chartPanel}`}>
              <header className={css.panelHeader}>
                <div><h2><TbChartBar /> {t('chart.title')}</h2><p>{t('chart.subtitle', { period: t(`periods.${period}`) })}</p></div>
                <div className={css.chartSummary}>
                  <span>{t('chart.averageCheck')}</span>
                  <strong>{canViewRevenue ? `${formatAmount(data.metrics.averageCheck ?? 0)} ${settings.currency}` : t('hidden')}</strong>
                </div>
              </header>
              <div className={css.statusStrip}>
                {(['placed', 'preparing', 'ready'] as OrderStatus[]).map(status => (
                  <span key={status} data-status={status}>
                    {t(`statuses.${status}`)} <strong>{data.statusCounts?.[status as 'placed' | 'preparing' | 'ready'] ?? 0}</strong>
                  </span>
                ))}
              </div>
              <div className={css.chart} role="img" aria-label={t('chart.ariaLabel')}>
                {data.series.map((point, index) => {
                  const showLabel = period !== '30d' || index % 5 === 0 || index === data.series.length - 1;
                  return (
                    <div
                      key={point.bucket}
                      className={css.chartColumn}
                      title={canViewRevenue
                        ? t('chart.tooltip', { orders: point.orders, revenue: formatAmount(point.revenue ?? 0) })
                        : t('chart.tooltipNoRevenue', { orders: point.orders })}
                    >
                      <span className={css.barValue}>{point.orders || ''}</span>
                      <span className={css.barTrack}>
                        <span className={css.bar} style={{ height: `${point.orders ? Math.max(8, (point.orders / maxOrders) * 100) : 2}%` }} />
                      </span>
                      <span className={`${css.barLabel} ${showLabel ? '' : css.barLabelHidden}`}>{bucketLabel(point.bucket, period, locale)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className={css.bottomGrid}>
            {canViewOrders && (
              <section className={css.panel}>
                <header className={css.panelHeader}>
                  <div><h2><TbToolsKitchen2 /> {t('recentOrders.title')}</h2><p>{ordersConnected ? t('recentOrders.live') : t('recentOrders.offline')}</p></div>
                  <Link href="/profile/orders" className={css.textLink}>{t('viewAll')}</Link>
                </header>
                {data.recentOrders.length === 0 ? (
                  <div className={css.compactEmpty}>{t('recentOrders.empty')}</div>
                ) : (
                  <div className={css.ordersList}>
                    {data.recentOrders.map(order => (
                      <Link href="/profile/orders" key={order.id} className={css.orderRow}>
                        <span className={css.tableBadge}>{order.tableNumber}</span>
                        <div className={css.orderMain}>
                          <strong>{t('recentOrders.table', { table: order.tableNumber })}</strong>
                          <span>{t('recentOrders.items', { count: order.itemCount })} · {ageLabel(t, order.ageMinutes)}</span>
                        </div>
                        <span className={css.orderStatus} data-status={order.status}>{t(`statuses.${order.status}`)}</span>
                        {canViewRevenue && <strong className={css.orderTotal}>{formatAmount(order.total ?? 0)} {settings.currency}</strong>}
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {canViewOrders && (
              <section className={css.panel}>
                <header className={css.panelHeader}>
                  <div><h2><TbChartBar /> {t('topProducts.title')}</h2><p>{t('topProducts.subtitle', { period: t(`periods.${period}`) })}</p></div>
                </header>
                {data.topProducts.length === 0 ? (
                  <div className={css.compactEmpty}>{t('topProducts.empty')}</div>
                ) : (
                  <ol className={css.productList}>
                    {data.topProducts.map((product, index) => (
                      <li key={product.productId}>
                        <span className={css.rank}>{index + 1}</span>
                        <div className={css.productInfo}>
                          <div><strong>{product.title}</strong><span>{t('topProducts.sold', { count: product.quantity })}</span></div>
                          <span className={css.productTrack}><span style={{ width: `${(product.quantity / maxProductQuantity) * 100}%` }} /></span>
                        </div>
                        {canViewRevenue && <strong>{formatAmount(product.revenue ?? 0)} {settings.currency}</strong>}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )}
          </div>

          <p className={css.updatedAt}>{t('updatedAt', { value: formatDateTime(new Date(), locale) })}</p>
        </>
      ) : null}
    </div>
  );
}
