'use client';

import type { ReactNode } from 'react';
import css from './Content.module.css';

export default function Content({ children }: { children: ReactNode }) {
  return <div className={css.content}>{children}</div>;
}
