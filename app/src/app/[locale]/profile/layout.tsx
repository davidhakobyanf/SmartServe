"use client";

import { useEffect, useState } from "react";
import { Button, Spin } from "antd";
import { useTranslations } from "next-intl";
import { TbChefHat, TbMenu2, TbRefresh } from "react-icons/tb";
import { usePathname, useRouter } from "@/i18n/navigation";
import css from "@/components/Profile/Profile.module.css";
import Sidebar from "@/components/Profile/Sidebar/Sidebar";
import { OrdersProvider } from "@/context/OrdersContext";
import { TablesProvider } from "@/context/TablesContext";
import { WaiterCallsProvider } from "@/context/WaiterCallsContext";
import { useProfileData } from "@/context/ProfileDataContext";
import type { Permission } from "@/types/staff";
import { useVenueSettings } from "@/context/VenueSettingsContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const ROUTE_ACCESS: Array<{
  path: string;
  permissions: Permission[];
}> = [
  { path: "/profile/dashboard", permissions: ["dashboard.view"] },
  { path: "/profile/menu", permissions: ["menu.view"] },
  { path: "/profile/orders", permissions: ["orders.view"] },
  { path: "/profile/tables", permissions: ["tables.view"] },
  { path: "/profile/waiter", permissions: ["waiter_calls.view"] },
  { path: "/profile/staff", permissions: ["users.view", "roles.manage"] },
  { path: "/profile/settings", permissions: ["venue.settings.manage"] },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const {
    permissions,
    isLoading,
    profileDataList,
    connectionState,
    fetchProfile,
  } = useProfileData();
  const { settings } = useVenueSettings();
  const isMobileNavigation = useMediaQuery("(max-width: 900px)");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      router.replace("/");
      return;
    }

   
    if (connectionState === "expired" && !isLoading) {
      void fetchProfile({ force: true });
    }
  }, [connectionState, fetchProfile, isLoading, router]);

  useEffect(() => {
    if (
      isLoading ||
      connectionState === "loading" ||
      connectionState === "unavailable" ||
      connectionState === "expired"
    ) {
      return;
    }

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
    router.replace(fallback?.path ?? "/profile/account");
  }, [connectionState, isLoading, pathname, permissions, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen]);

  if (
    (isLoading || connectionState === "loading") &&
    !profileDataList.id
  ) {
    return (
      <div className={css.serviceState} role="status">
        <div className={css.serviceStateCard}>
          <Spin size="large" />
          <h1>{t("connection.loadingTitle")}</h1>
          <p>{t("connection.loadingMessage")}</p>
        </div>
      </div>
    );
  }

  if (connectionState === "unavailable" && !profileDataList.id) {
    return (
      <div className={css.serviceState} role="alert">
        <div className={css.serviceStateCard}>
          <h1>{t("connection.unavailableTitle")}</h1>
          <p>{t("connection.unavailableMessage")}</p>
          <Button
            type="primary"
            icon={<TbRefresh />}
            loading={isLoading}
            onClick={() => void fetchProfile({ force: true })}
          >
            {t("connection.retry")}
          </Button>
        </div>
      </div>
    );
  }

  const navigationOpen = !isMobileNavigation || sidebarOpen;

  return (
    <OrdersProvider>
      <TablesProvider>
        <WaiterCallsProvider>
          <div className={css.shell}>
            {connectionState === "reconnecting" && (
              <div className={css.connectionBanner} role="status">
                <Spin size="small" />
                <span>{t("connection.reconnecting")}</span>
              </div>
            )}
            <header className={css.mobileHeader}>
              <button
                type="button"
                className={css.menuButton}
                aria-label={t("openMenu")}
                aria-controls="profile-navigation"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen(true)}
              >
                <TbMenu2 />
              </button>
              <span className={css.mobileBrandIcon}>
                <TbChefHat />
              </span>
              <span className={css.mobileBrandName}>{settings.venueName}</span>
            </header>
            {sidebarOpen && isMobileNavigation && (
              <button
                type="button"
                className={css.overlay}
                aria-label={t("closeMenu")}
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
      </TablesProvider>
    </OrdersProvider>
  );
}
