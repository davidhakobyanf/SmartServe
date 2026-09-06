'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { TbChefHat, TbMenu2 } from 'react-icons/tb';
import { usePathname, useRouter } from '@/i18n/navigation';
import css from '@/components/Profile/Profile.module.css';
import Sidebar from '@/components/Profile/Sidebar/Sidebar';
import { OrdersProvider } from '@/context/OrdersContext';
import { WaiterCallsProvider } from '@/context/WaiterCallsContext';
import { useProfileData } from '@/context/ProfileDataContext';
import type { Permission } from '@/types/staff';
import { useVenueSettings } from '@/context/VenueSettingsContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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
  const t = useTranslations('nav');
  const { permissions, isLoading } = useProfileData();
  const { settings } = useVenueSettings();
  const isMobileNavigation = useMediaQuery('(max-width: 900px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [sidebarOpen]);

  const navigationOpen = !isMobileNavigation || sidebarOpen;

  return (
    <OrdersProvider>
      <WaiterCallsProvider>
        <div className={css.shell}>
          <header className={css.mobileHeader}>
            <button
              type="button"
              className={css.menuButton}
              aria-label={t('openMenu')}
              aria-controls="profile-navigation"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <TbMenu2 />
            </button>
            <span className={css.mobileBrandIcon}><TbChefHat /></span>
            <span className={css.mobileBrandName}>{settings.venueName}</span>
          </header>
          {sidebarOpen && isMobileNavigation && (
            <button
              type="button"
              className={css.overlay}
              aria-label={t('closeMenu')}
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <Sidebar
            isOpen={navigationOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <main className={`${css.main} ss-scroll`}>{children}</main>
        </div>
      </WaiterCallsProvider>
    </OrdersProvider>
  );
}
