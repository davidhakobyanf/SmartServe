import type { HTMLAttributes, ReactNode } from 'react';
import css from './PageHeader.module.css';
import Typography from '@/components/Common/Typography/Typography';

interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  className,
  ...headerProps
}: PageHeaderProps) {
  return (
    <header
      className={`${css.header}${className ? ` ${className}` : ''}`}
      {...headerProps}
    >
      <div className={css.copy}>
        <Typography as="h1" variant="pageTitle" className={css.title}>{title}</Typography>
        {subtitle && <Typography variant="bodyMuted" className={css.subtitle}>{subtitle}</Typography>}
      </div>
      {actions && <div className={css.actions}>{actions}</div>}
    </header>
  );
}
