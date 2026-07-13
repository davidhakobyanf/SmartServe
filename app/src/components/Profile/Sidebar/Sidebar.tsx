'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
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
} from 'react-icons/tb';
import type { IconType } from 'react-icons';
import { useProfileData } from '@/context/ProfileDataContext';
import { useWaiterCalls } from '@/context/WaiterCallsContext';
import { useOrders } from '@/context/OrdersContext';
import css from './Sidebar.module.css';

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  badge?: 'orders' | 'waiter';
};

const NAV: NavItem[] = [
  { href: '/profile/dashboard', label: 'Dashboard', icon: TbLayoutDashboard },
  { href: '/profile/menu', label: 'Menu Management', icon: TbToolsKitchen2 },
  { href: '/profile/orders', label: 'Orders', icon: TbShoppingBag, badge: 'orders' },
  { href: '/profile/tables', label: 'Tables', icon: TbTable },
  { href: '/profile/waiter', label: 'Waiter Calls', icon: TbBell, badge: 'waiter' },
  { href: '/profile/account', label: 'Profile', icon: TbUser },
  { href: '/profile/settings', label: 'Settings', icon: TbSettings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profileDataList } = useProfileData();
  const { calls } = useWaiterCalls();
  const { newCount } = useOrders();

  const fullName = [profileDataList.name, profileDataList.surname]
    .filter(Boolean)
    .join(' ');
  const initials =
    (profileDataList.name?.[0] ?? '') + (profileDataList.surname?.[0] ?? '') ||
    'RO';

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    router.push('/');
  };

  return (
    <aside className={css.sidebar}>
      <div className={css.brand}>
        <span className={css.logo}>
          <TbChefHat />
        </span>
        <span className={css.brandText}>SmartServe</span>
      </div>

      <nav className={css.nav}>
        {NAV.map(({ href, label, icon: Icon, badge }) => {
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
              <span>{label}</span>
              {badgeCount > 0 && (
                <span className={css.navBadge}>{badgeCount}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <button type="button" className={css.logout} onClick={logout}>
        <TbLogout className={css.navIcon} />
        <span>Logout</span>
      </button>

      <div className={css.userCard}>
        <span className={css.avatar}>{initials.toUpperCase()}</span>
        <div className={css.userMeta}>
          <span className={css.userName}>
            {fullName || 'Restaurant Owner'}
          </span>
          <span className={css.userStatus}>
            <span className={css.dot} /> Online
          </span>
        </div>
      </div>
    </aside>
  );
}
