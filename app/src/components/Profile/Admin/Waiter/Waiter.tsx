'use client';

import { useTranslations } from 'next-intl';
import { TbBell, TbBellRinging, TbCheck, TbChecks } from 'react-icons/tb';
import { useWaiterCalls } from '@/context/WaiterCallsContext';
import type { WaiterCall } from '@/types/waiter';
import PageHeader from '@/components/Common/PageHeader/PageHeader';
import css from './Waiter.module.css';

function timeAgo(
  t: ReturnType<typeof useTranslations>,
  iso?: string,
): string {
  if (!iso) return t('time.justNow');
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return t('time.justNow');
  const min = Math.floor(Math.max(0, Date.now() - then) / 60000);
  if (min < 1) return t('time.justNow');
  if (min < 60) return t('time.minAgo', { min });
  return t('time.hourAgo', { hrs: Math.floor(min / 60) });
}

export default function Waiter() {
  const t = useTranslations('waiter');
  const { calls, dismissCall, clearAll } = useWaiterCalls();

  return (
    <div className={css.page}>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={calls.length > 0 ? (
          <button type="button" className={css.clearBtn} onClick={clearAll}>
            <TbChecks /> {t('resolveAll')}
          </button>
        ) : null}
      />

      {calls.length === 0 ? (
        <div className={css.empty}>
          <span className={css.emptyIcon}>
            <TbBell />
          </span>
          <h2>{t('empty.title')}</h2>
          <p>{t('empty.subtitle')}</p>
        </div>
      ) : (
        <div className={css.list}>
          {calls.map((call: WaiterCall) => (
            <div key={call.id} className={css.call}>
              <span className={css.callIcon}>
                <TbBellRinging />
              </span>
              <div className={css.callInfo}>
                <div className={css.callTop}>
                  <span className={css.callTable}>{t('table', { n: call.table })}</span>
                  <span className={css.newTag}>{t('new')}</span>
                </div>
                <span className={css.callText}>{t('needsAssistance')}</span>
              </div>
              <div className={css.callRight}>
                <span className={css.callTime}>{timeAgo(t, call.calledAt)}</span>
                <button
                  type="button"
                  className={css.resolveBtn}
                  onClick={() => dismissCall(call.id)}
                >
                  <TbCheck /> {t('resolve')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
