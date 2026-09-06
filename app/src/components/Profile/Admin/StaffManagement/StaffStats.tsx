import { useTranslations } from 'next-intl';
import { TbKey, TbShieldCheck, TbUserCheck, TbUsers } from 'react-icons/tb';
import css from './StaffManagement.module.css';

interface StaffStatsProps {
  total: number;
  pending: number;
  active: number;
  roles: number;
}

export default function StaffStats(props: StaffStatsProps) {
  const t = useTranslations('staff');
  const items = [
    { key: 'total', value: props.total, icon: TbUsers, tone: 'primary' },
    { key: 'pending', value: props.pending, icon: TbUserCheck, tone: 'amber' },
    { key: 'active', value: props.active, icon: TbShieldCheck, tone: 'green' },
    { key: 'roles', value: props.roles, icon: TbKey, tone: 'violet' },
  ] as const;

  return (
    <section className={css.stats} aria-label={t('title')}>
      {items.map(({ key, value, icon: Icon, tone }) => (
        <div className={css.stat} key={key}>
          <span className={`${css.statIcon} ${css[tone]}`}><Icon /></span>
          <div><strong>{value}</strong><span>{t(`stats.${key}`)}</span></div>
        </div>
      ))}
    </section>
  );
}
