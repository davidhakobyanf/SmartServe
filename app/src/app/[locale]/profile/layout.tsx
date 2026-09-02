'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import css from '@/components/Profile/Profile.module.css';
import Sidebar from '@/components/Profile/Sidebar/Sidebar';
import { OrdersProvider } from '@/context/OrdersContext';
import { WaiterCallsProvider } from '@/context/WaiterCallsContext';
import { useProfileData } from '@/context/ProfileDataContext';
import type { Permission } from '@/types/staff';

const ROUTE_ACCESS: Array<{
  path: string;
  permissions: Permission[];
}> = [
  { path: '/profile/dashboard', permissions: ['dashboard.view'] },
  { path: '/profile/menu', permissions: ['menu.view'] },
  { path: '/profile/orders', permissions: ['orders.view'] },
  { path: '/profile/tables', permissions: ['tables.view'] },
  { path: '/profile/waiter', permissions: ['waiter_calls.view'] },
  { path: '/profile/staff', permissions: ['users.view', 'roles.manage'] },
  { path: '/profile/settings', permissions: ['venue.settings.manage'] },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { permissions, isLoading } = useProfileData();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.replace('/');
    }
  }, [router]);

  useEffect(() => {
    if (isLoading) return;

    const currentRoute = ROUTE_ACCESS.find(({ path }) =>
      pathname.startsWith(path),
    );
    if (
      !currentRoute ||
      currentRoute.permissions.some((permission) =>
        permissions.includes(permission),
      )
    ) {
      return;
    }

    const fallback = ROUTE_ACCESS.find(({ permissions: required }) =>
      required.some((permission) => permissions.includes(permission)),
    );
    router.replace(fallback?.path ?? '/profile/account');
  }, [isLoading, pathname, permissions, router]);

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
