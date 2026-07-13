'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import css from '@/components/Profile/Profile.module.css';
import Sidebar from '@/components/Profile/Sidebar/Sidebar';
import { OrdersProvider } from '@/context/OrdersContext';
import { WaiterCallsProvider } from '@/context/WaiterCallsContext';

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
      <WaiterCallsProvider>
        <div className={css.shell}>
          <Sidebar />
          <main className={`${css.main} ss-scroll`}>{children}</main>
        </div>
      </WaiterCallsProvider>
    </OrdersProvider>
  );
}
