'use client';

import { TbBell, TbBellRinging, TbCheck, TbChecks } from 'react-icons/tb';
import { useWaiterCalls } from '@/context/WaiterCallsContext';
import type { WaiterCall } from '@/types/waiter';
import css from './Waiter.module.css';

function timeAgo(iso?: string): string {
  if (!iso) return 'just now';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'just now';
  const min = Math.floor(Math.max(0, Date.now() - then) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  return `${Math.floor(min / 60)} h ago`;
}

export default function Waiter() {
  const { calls, dismissCall, clearAll } = useWaiterCalls();

  return (
    <div className={css.page}>
      <header className={css.header}>
        <div>
          <h1 className={css.title}>Waiter Calls</h1>
          <p className={css.subtitle}>Manage customer service requests</p>
        </div>
        {calls.length > 0 && (
          <button type="button" className={css.clearBtn} onClick={clearAll}>
            <TbChecks /> Resolve all
          </button>
        )}
      </header>

      {calls.length === 0 ? (
        <div className={css.empty}>
          <span className={css.emptyIcon}>
            <TbBell />
          </span>
          <h2>Ամեն ինչ հանգիստ է</h2>
          <p>Ակտիվ կանչեր չկան այս պահին։</p>
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
                  <span className={css.callTable}>Table {call.table}</span>
                  <span className={css.newTag}>New</span>
                </div>
                <span className={css.callText}>Customer needs assistance</span>
              </div>
              <div className={css.callRight}>
                <span className={css.callTime}>{timeAgo(call.calledAt)}</span>
                <button
                  type="button"
                  className={css.resolveBtn}
                  onClick={() => dismissCall(call.id)}
                >
                  <TbCheck /> Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
