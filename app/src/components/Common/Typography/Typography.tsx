import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import css from './Typography.module.css';

type TypographyVariant =
  | 'pageTitle'
  | 'sectionTitle'
  | 'body'
  | 'bodyMuted'
  | 'caption'
  | 'label';

type TypographyProps<T extends ElementType> = {
  as?: T;
  variant?: TypographyVariant;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export default function Typography<T extends ElementType = 'p'>({
  as,
  variant = 'body',
  className,
  children,
  ...props
}: TypographyProps<T>) {
  const Component = as ?? 'p';
  const classes = `${css[variant]}${className ? ` ${className}` : ''}`;
  return <Component className={classes} {...props}>{children}</Component>;
}
