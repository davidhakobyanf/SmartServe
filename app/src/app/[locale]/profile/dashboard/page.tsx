'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Alert, Spin } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { TbRefresh } from 'react-icons/tb';
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
import type { DashboardPeriod, DashboardSeriesPoint } from '@/types/dashboard';
import css from './DashboardPage.module.css';

const PERIODS: DashboardPeriod[] = ['today', '7d', '30d'];
const LATE_MINUTES = 10;

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

/** Area path + baseline fill for a fluid sparkline drawn in a 0 0 100 40 viewBox. */
function areaPaths(values: number[]) {
  if (values.length < 2) return { line: '', fill: '' };
  const max = Math.max(1, ...values);
  const step = 100 / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(2)},${(38 - (v / max) * 34).toFixed(2)}`);
  return {
    line: `M${points.join(' L')}`,
    fill: `M${points.join(' L')} L100,40 L0,40 Z`,
  };
}

export default function ProfileDashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { permissions, isLoading: profileLoading } = useProfileData();
  const { settings } = useVenueSettings();
  const { calls } = useWaiterCalls();
  const { ready: ordersReady, revision: ordersRevision, isConnected: ordersConnected } = useOrders();
  const { ready: tablesReady, revision: tablesRevision } = useTables();
  const canViewOrders = permissions.includes('orders.view');
  const canViewRevenue = canViewOrders && permissions.includes('revenue.view');
  const canViewTables = permissions.includes('tables.view');
  const canViewMenu = permissions.includes('menu.view');
  const canViewWaiterCalls = permissions.includes('waiter_calls.view');
  const { ready: menuReady, revision: menuRevision } = useMenuConnection(canViewMenu);
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const connectionsReady =
    (!canViewOrders || ordersReady) && (!canViewTables || tablesReady) && (!canViewMenu || menuReady);
  const dashboard = useDashboardData(period, !profileLoading && connectionsReady);
  const data = dashboard.data;
  const initialLoading = profileLoading || !connectionsReady || (dashboard.loading && !data);

  const revisionKey = `${ordersRevision}:${tablesRevision}:${menuRevision}`;
  const lastRevision = useRef(revisionKey);
  useEffect(() => {
    if (lastRevision.current !== revisionKey && data) dashboard.invalidate();
    lastRevision.current = revisionKey;
  }, [data, dashboard, revisionKey]);

  const series = useMemo<DashboardSeriesPoint[]>(() => data?.series ?? [], [data?.series]);
  const delayedOrders = useMemo(
    () => data?.recentOrders.filter(order => order.ageMinutes >= LATE_MINUTES) ?? [],
    [data?.recentOrders],
  );
  const attentionCount =
    delayedOrders.length + (canViewMenu ? data?.lowStock.length ?? 0 : 0) + (canViewWaiterCalls ? calls.length : 0);

  const revenuePaths = useMemo(
    () => areaPaths(series.map(point => point.revenue ?? 0)),
    [series],
  );
  const maxOrders = Math.max(1, ...series.map(point => point.orders));
  const maxProductQuantity = Math.max(1, ...(data?.topProducts.map(product => product.quantity) ?? [0]));
  const peak = useMemo(
    () => series.reduce<DashboardSeriesPoint | null>((best, point) => (!best || point.orders > best.orders ? point : best), null),
    [series],
  );
  const statusCounts = data?.statusCounts;
  const pipeline = [
    { key: 'placed', value: statusCounts?.placed ?? 0 },
    { key: 'preparing', value: statusCounts?.preparing ?? 0 },
    { key: 'ready', value: statusCounts?.ready ?? 0 },
  ];
  const pipelineMax = Math.max(1, ...pipeline.map(item => item.value), delayedOrders.length);

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
          action={
            <button className={css.retryButton} onClick={() => void dashboard.refresh()}>
              {t('retry')}
            </button>
          }
        />
      ) : data ? (
        <>
          {dashboard.error && <Alert type="warning" showIcon message={t('refreshError')} />}

          <div className={css.bento}>
            {/* ── Revenue hero ─────────────────────────────── */}
            {canViewRevenue && (
              <section className={`${css.tile} ${css.hero}`}>
                <div className={css.tileHead}>
                  <span className={css.kicker}>{t('metrics.revenue', { period: t(`periods.${period}`) })}</span>
                </div>
                <div className={css.heroValue}>
                  <strong>{formatAmount(data.metrics.revenue ?? 0)}</strong>
                  <span>{settings.currency}</span>
                </div>
                <p className={css.heroMeta}>
                  {t('chart.averageCheck')}: {formatAmount(data.metrics.averageCheck ?? 0)} {settings.currency}
                </p>
                <svg className={css.spark} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="var(--primary)" stopOpacity=".35" />
                      <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={revenuePaths.fill} fill="url(#revFill)" />
                  <path
                    d={revenuePaths.line}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </section>
            )}

            {/* ── Compact KPI tiles ────────────────────────── */}
            {canViewOrders && (
              <section className={`${css.tile} ${css.kpi}`}>
                <span className={css.kicker}>{t('metrics.orders', { period: t(`periods.${period}`) })}</span>
                <strong>{data.metrics.orders ?? 0}</strong>
              </section>
            )}
            {canViewOrders && (
              <section className={`${css.tile} ${css.kpi}`}>
                <span className={css.kicker}>{t('metrics.activeOrders')}</span>
                <strong>{data.metrics.activeOrders ?? 0}</strong>
              </section>
            )}
            {canViewTables && (
              <section className={`${css.tile} ${css.kpi}`}>
                <span className={css.kicker}>{t('metrics.occupiedTables')}</span>
                <strong>
                  {data.metrics.occupiedTables ?? 0}
                  <small>/{data.metrics.totalTables ?? 0}</small>
                </strong>
              </section>
            )}
            {canViewRevenue && (
              <section className={`${css.tile} ${css.kpi}`}>
                <span className={css.kicker}>{t('chart.averageCheck')}</span>
                <strong>
                  {formatAmount(data.metrics.averageCheck ?? 0)}
                  <small> {settings.currency}</small>
                </strong>
              </section>
            )}

            {/* ── Live pipeline ────────────────────────────── */}
            {canViewOrders && (
              <section className={`${css.tile} ${css.pipeline}`}>
                <div className={css.tileHead}>
                  <span className={css.kicker}>{t('chart.title')}</span>
                  <span className={ordersConnected ? css.liveDot : css.offlineDot} aria-hidden="true" />
                </div>
                <ul className={css.pipelineList}>
                  {pipeline.map(item => (
                    <li key={item.key} data-status={item.key}>
                      <span>{t(`statuses.${item.key}`)}</span>
                      <span className={css.track}>
                        <span style={{ width: `${(item.value / pipelineMax) * 100}%` }} />
                      </span>
                      <strong>{item.value}</strong>
                    </li>
                  ))}
                  <li data-status="late">
                    <span>{t('attention.title')}</span>
                    <span className={css.track}>
                      <span style={{ width: `${(delayedOrders.length / pipelineMax) * 100}%` }} />
                    </span>
                    <strong>{delayedOrders.length}</strong>
                  </li>
                </ul>
                <div className={css.pipelineActions}>
                  <Link href="/profile/orders">{t('quickActions.orders')}</Link>
                  {canViewWaiterCalls && (
                    <Link href="/profile/waiter">
                      {t('quickActions.waiter')} {calls.length ? `· ${calls.length}` : ''}
                    </Link>
                  )}
                </div>
              </section>
            )}

            {/* ── Load by bucket (bars) ────────────────────── */}
            {canViewOrders && (
              <section className={`${css.tile} ${css.load}`}>
                <div className={css.tileHead}>
                  <div>
                    <h2>{t('chart.title')}</h2>
                    <p>{t('chart.subtitle', { period: t(`periods.${period}`) })}</p>
                  </div>
                  {peak && (
                    <div className={css.peak}>
                      <span>{t('chart.peak')}</span>
                      <strong>{bucketLabel(peak.bucket, period, locale)}</strong>
                      <span>
                        {t('chart.tooltipNoRevenue', { orders: peak.orders })}
                      </span>
                    </div>
                  )}
                </div>
                <div className={css.chart} role="img" aria-label={t('chart.ariaLabel')}>
                  {series.map((point, index) => {
                    const showLabel = period !== '30d' || index % 5 === 0 || index === series.length - 1;
                    return (
                      <div
                        key={point.bucket}
                        className={css.chartColumn}
                        data-peak={peak?.bucket === point.bucket ? 'true' : undefined}
                        title={
                          canViewRevenue
                            ? t('chart.tooltip', { orders: point.orders, revenue: formatAmount(point.revenue ?? 0) })
                            : t('chart.tooltipNoRevenue', { orders: point.orders })
                        }
                      >
                        <span className={css.barTrack}>
                          <span
                            className={css.bar}
                            style={{ height: `${point.orders ? Math.max(6, (point.orders / maxOrders) * 100) : 2}%` }}
                          />
                        </span>
                        <span className={`${css.barLabel} ${showLabel ? '' : css.barLabelHidden}`}>
                          {bucketLabel(point.bucket, period, locale)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Current queue ────────────────────────────── */}
            {canViewOrders && (
              <section className={`${css.tile} ${css.queue}`}>
                <div className={css.tileHead}>
                  <div>
                    <h2>{t('recentOrders.title')}</h2>
                    <p>{ordersConnected ? t('recentOrders.live') : t('recentOrders.offline')}</p>
                  </div>
                  <Link href="/profile/orders" className={css.textLink}>
                    {t('viewAll')}
                  </Link>
                </div>
                {data.recentOrders.length === 0 ? (
                  <div className={css.compactEmpty}>{t('recentOrders.empty')}</div>
                ) : (
                  <div className={css.ordersList}>
                    {data.recentOrders.map(order => (
                      <Link href="/profile/orders" key={order.id} className={css.orderRow}>
                        <span className={css.tableBadge}>{order.tableNumber}</span>
                        <span className={css.orderMain}>
                          <strong>{t('recentOrders.table', { table: order.tableNumber })}</strong>
                          <span>
                            {t('recentOrders.items', { count: order.itemCount })} · {ageLabel(t, order.ageMinutes)}
                          </span>
                        </span>
                        <span
                          className={css.orderStatus}
                          data-status={order.ageMinutes >= LATE_MINUTES ? 'late' : order.status}
                        >
                          {t(`statuses.${order.status}`)}
                        </span>
                        {canViewRevenue && (
                          <strong className={css.orderTotal}>
                            {formatAmount(order.total ?? 0)} {settings.currency}
                          </strong>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── Top products ─────────────────────────────── */}
            {canViewOrders && (
              <section className={`${css.tile} ${css.top}`}>
                <div className={css.tileHead}>
                  <div>
                    <h2>{t('topProducts.title')}</h2>
                    <p>{t('topProducts.subtitle', { period: t(`periods.${period}`) })}</p>
                  </div>
                </div>
                {data.topProducts.length === 0 ? (
                  <div className={css.compactEmpty}>{t('topProducts.empty')}</div>
                ) : (
                  <ol className={css.productList}>
                    {data.topProducts.map((product, index) => (
                      <li key={product.productId}>
                        <span className={css.rank}>{String(index + 1).padStart(2, '0')}</span>
                        <strong className={css.productTitle}>{product.title}</strong>
                        <span className={css.track}>
                          <span style={{ width: `${(product.quantity / maxProductQuantity) * 100}%` }} />
                        </span>
                        <span className={css.productQty}>{product.quantity}</span>
                        {canViewRevenue && (
                          <span className={css.productRevenue}>{formatAmount(product.revenue ?? 0)}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )}

            {/* ── Needs attention ──────────────────────────── */}
            <section className={`${css.tile} ${css.attention}`}>
              <div className={css.tileHead}>
                <div>
                  <h2>{t('attention.title')}</h2>
                  <p>{t('attention.subtitle')}</p>
                </div>
                <span className={attentionCount ? css.countAlert : css.countOk}>{attentionCount}</span>
              </div>
              {attentionCount === 0 ? (
                <div className={css.allClear}>
                  <strong>{t('attention.allClear')}</strong>
                  <span>{t('attention.allClearHint')}</span>
                </div>
              ) : (
                <div className={css.attentionList}>
                  {canViewWaiterCalls &&
                    calls.slice(0, 2).map(call => (
                      <Link key={call.id} href="/profile/waiter" className={css.attentionItem} data-tone="warning">
                        <strong>{t('attention.waiter', { table: call.table })}</strong>
                        <span>{t('attention.waiterHint')}</span>
                      </Link>
                    ))}
                  {delayedOrders.slice(0, 2).map(order => (
                    <Link key={order.id} href="/profile/orders" className={css.attentionItem} data-tone="danger">
                      <strong>{t('attention.delayedOrder', { table: order.tableNumber })}</strong>
                      <span>{ageLabel(t, order.ageMinutes)}</span>
                    </Link>
                  ))}
                  {canViewMenu &&
                    data.lowStock.slice(0, 2).map(product => (
                      <Link key={product.id} href="/profile/menu" className={css.attentionItem} data-tone="stock">
                        <strong>{product.title}</strong>
                        <span>{t('attention.lowStock', { count: product.stockQuantity })}</span>
                      </Link>
                    ))}
                </div>
              )}
            </section>
          </div>

          <p className={css.updatedAt}>{t('updatedAt', { value: formatDateTime(new Date(), locale) })}</p>
        </>
      ) : null}
    </div>
  );
}
