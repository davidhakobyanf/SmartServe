import { useLocale, useTranslations } from 'next-intl';
import { TbCheck, TbChefHat, TbClipboardList, TbRefresh } from 'react-icons/tb';
import type { OrderRecord } from '@/types/orders';
import { formatAmount } from '@/lib/formatters';
import css from './ClientDashboard.module.css';

interface Props {
  orders: OrderRecord[];
  loading: boolean;
  error: boolean;
  onRefresh: () => Promise<void>;
}

export default function ClientOrderHistory({ orders, loading, error, onRefresh }: Props) {
  const t = useTranslations('client');
  const statusT = useTranslations('orders');
  const locale = useLocale();
  return (
    <div className={`${css.orderList} ${css.historyList} ss-scroll`}>
      <button type="button" className={css.historyRefresh} onClick={() => void onRefresh()} disabled={loading}>
        <TbRefresh /> {t('history.refresh')}
      </button>
      {error && <p role="alert" className={css.historyError}>{t('history.loadError')}</p>}
      {loading && orders.length === 0 ? <p role="status">{t('history.loading')}</p> : orders.length === 0 ? (
        <div className={css.orderEmpty}><TbClipboardList /><p>{t('history.empty')}</p></div>
      ) : orders.map((order) => {
        const status = order.status ?? 'placed';
        return (
          <article key={order._id} className={css.historyCard}>
            <div className={css.historyHeading}>
              <strong>{t('history.orderNumber', { id: order._id.slice(-5).toUpperCase() })}</strong>
              {order.createdAt && <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleTimeString(locale === 'am' ? 'hy-AM' : locale, { hour: '2-digit', minute: '2-digit' })}</time>}
            </div>
            <span className={css.historyStatus} data-status={status}>
              {status === 'ready' || status === 'completed' ? <TbCheck /> : <TbChefHat />}
              {statusT(`statuses.${status}`)}
            </span>
            <ul className={css.historyItems}>
              {order.items.map((item, index) => (
                <li key={`${item.id}-${index}`}>
                  <span>{item.title}{Boolean(item.sauces?.length) && <small>{item.sauces?.map((sauce) => sauce.name).join(', ')}</small>}</span>
                  <strong>× {item.count ?? 1}</strong>
                </li>
              ))}
            </ul>
            <div className={css.historyTotal}><span>{t('order.total')}</span><strong>{formatAmount(order.allPrice)} ֏</strong></div>
          </article>
        );
      })}
    </div>
  );
}
