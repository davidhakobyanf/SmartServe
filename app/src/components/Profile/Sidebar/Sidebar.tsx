'use client';

import { useTranslations } from 'next-intl';
import { usePathname, useRouter, Link } from '@/i18n/navigation';
import {
  TbLayoutDashboard,
  TbToolsKitchen2,
  TbShoppingBag,
  TbTable,
  TbBell,
  TbUser,
  TbSettings,
  TbLogout,
  TbChefHat,
  TbUsers,
} from 'react-icons/tb';
import type { IconType } from 'react-icons';
import { useProfileData } from '@/context/ProfileDataContext';
import { useWaiterCalls } from '@/context/WaiterCallsContext';
import { useOrders } from '@/context/OrdersContext';
import { useVenueSettings } from '@/context/VenueSettingsContext';
import LanguageSwitcher from '@/components/LanguageSwitcher/LanguageSwitcher';
import css from './Sidebar.module.css';
import type { Permission } from '@/types/staff';
import { profileImageApiUrl } from '@/lib/entityImages';

type NavItem = {
  href: string;
  labelKey: string;
  icon: IconType;
  badge?: 'orders' | 'waiter';
  permissions?: Permission[];
};

const NAV: NavItem[] = [
  { href: '/profile/dashboard', labelKey: 'dashboard', icon: TbLayoutDashboard, permissions: ['dashboard.view'] },
  { href: '/profile/menu', labelKey: 'menu', icon: TbToolsKitchen2, permissions: ['menu.view'] },
  { href: '/profile/orders', labelKey: 'orders', icon: TbShoppingBag, badge: 'orders', permissions: ['orders.view'] },
  { href: '/profile/tables', labelKey: 'tables', icon: TbTable, permissions: ['tables.view'] },
  { href: '/profile/waiter', labelKey: 'waiter', icon: TbBell, badge: 'waiter', permissions: ['waiter_calls.view'] },
  { href: '/profile/staff', labelKey: 'staff', icon: TbUsers, permissions: ['users.view', 'roles.manage'] },
  { href: '/profile/account', labelKey: 'profile', icon: TbUser },
  { href: '/profile/settings', labelKey: 'settings', icon: TbSettings, permissions: ['venue.settings.manage'] },
];

export default function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const { profileDataList, permissions } = useProfileData();
  const { calls } = useWaiterCalls();
  const { newCount } = useOrders();
  const { settings } = useVenueSettings();

  const fullName = [profileDataList.name, profileDataList.surname]
    .filter(Boolean)
    .join(' ');
  const initials =
    (profileDataList.name?.[0] ?? '') + (profileDataList.surname?.[0] ?? '') ||
    'RO';
  const avatarSrc =
    profileDataList.id && profileDataList.avatarName
      ? profileImageApiUrl(profileDataList.id, profileDataList.updatedAt)
      : null;

  const logout = () => {
    localStorage.removeItem('accessToken');
    router.push('/');
  };

  return (
    <aside className={css.sidebar}>
      <div className={css.brand}>
        <span className={css.logo}>
          <TbChefHat />
        </span>
        <span className={css.brandText}>{settings.venueName}</span>
      </div>

      <nav className={css.nav}>
        {NAV.filter(
          (item) =>
            !item.permissions ||
            item.permissions.some((permission) => permissions.includes(permission)),
        ).map(({ href, labelKey, icon: Icon, badge }) => {
          const active = pathname === href || pathname?.startsWith(href + '/');
          const badgeCount =
            badge === 'waiter'
              ? calls.length
              : badge === 'orders'
                ? newCount
                : 0;
          return (
            <Link
              key={href}
              href={href}
              className={`${css.navItem} ${active ? css.active : ''}`}
            >
              <Icon className={css.navIcon} />
              <span>{t(labelKey)}</span>
              {badgeCount > 0 && (
                <span className={css.navBadge}>{badgeCount}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={css.langSwitch}>
        <LanguageSwitcher size="small" />
      </div>

      <button type="button" className={css.logout} onClick={logout}>
        <TbLogout className={css.navIcon} />
        <span>{t('logout')}</span>
      </button>

      <Link href="/profile/account" className={css.userCard}>
        <span className={css.avatar}>
          {initials.toUpperCase()}
          {avatarSrc && (
            <img
              src={avatarSrc}
              alt={fullName}
              className={css.avatarImage}
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          )}
        </span>
        <div className={css.userMeta}>
          <span className={css.userName}>
            {fullName || t('ownerFallback')}
          </span>
          <span className={css.userStatus}>
            <span className={css.dot} /> {t('online')}
          </span>
        </div>
      </Link>
    </aside>
  );
}
