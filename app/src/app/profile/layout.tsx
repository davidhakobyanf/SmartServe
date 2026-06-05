'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import css from '@/components/Profile/Profile.module.css';
import Content from '@/components/Profile/Content/Content';
import { OrdersProvider } from '@/context/OrdersContext';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      router.replace('/');
    }
  }, [router]);

  return (
    <OrdersProvider>
    <div className={css.all_page}>
      <Content>{children}</Content>
    </div>
    </OrdersProvider>
  );
}
