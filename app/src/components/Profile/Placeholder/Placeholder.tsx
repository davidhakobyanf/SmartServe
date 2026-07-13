'use client';

import type { ReactNode } from 'react';
import css from './Placeholder.module.css';

interface PlaceholderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export default function Placeholder({ icon, title, subtitle }: PlaceholderProps) {
  return (
    <div className={css.wrap}>
      <div className={css.header}>
        <h1 className={css.title}>{title}</h1>
        <p className={css.subtitle}>{subtitle}</p>
      </div>
      <div className={css.card}>
        <span className={css.icon}>{icon}</span>
        <h2 className={css.cardTitle}>Coming soon</h2>
        <p className={css.cardText}>
          Այս բաժնի ձևավորումը շուտով կլինի պատրաստ։
        </p>
      </div>
    </div>
  );
}
