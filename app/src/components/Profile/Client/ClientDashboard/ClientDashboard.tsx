'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { App, Input, Select, ConfigProvider } from 'antd';
import {
  TbUser,
  TbBell,
  TbShoppingCart,
  TbSearch,
  TbLayoutGrid,
  TbSoup,
  TbMeat,
  TbCake,
  TbGlassFull,
  TbSun,
} from 'react-icons/tb';
import css from './ClientDashboard.module.css';
import { useProfileData } from '@/context/ProfileDataContext';
import { useFetching } from '@/hoc/fetchingHook';
import clientAPI, { setSessionToken } from '@/api/api';
import ClientCardModal from '../ClientCardModal/ClientCardModal';
import { loadMenuImages } from '@/lib/menuImages';
import {
  basketItemToMenuCard,
  productToMenuCard,
} from '@/lib/normalizeMenuCard';
import type { MenuCard, MenuImage } from '@/types';
import type { DiningSession } from '@/types/tables';
import type { BasketItemRecord, ProductRecord } from '@/types/restaurant';
import { useWaiterClient } from '@/hooks/useWaiterClient';
import { useSessionLock } from '@/hooks/useSessionLock';
import LanguageSwitcher from '@/components/LanguageSwitcher/LanguageSwitcher';
import { getMenuLineTotal } from '@/lib/clientMenu';
import { createSocket } from '@/lib/ws/socket';
import ClientMenuGrid from './ClientMenuGrid';
import ClientOrderPanel from './ClientOrderPanel';

const MIN_PAGE_SIZE = 8;
const MENU_NAMESPACE = '/menu';
const MENU_UPDATED_EVENT = 'menu:updated';

const CATEGORY_ICONS = [TbSoup, TbMeat, TbCake, TbGlassFull];

export default function ClientDashboard() {
  const t = useTranslations('client');
  const locale = useLocale();
  const { message } = App.useApp();
  const params = useParams();
  const sessionId = params?.clientId as string;
  const { closed, basketItems: liveBasketItems } = useSessionLock(
    sessionId ?? null,
  );
  const [session, setSession] = useState<DiningSession | null>(null);
  const [sessionUnavailable, setSessionUnavailable] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [menuCards, setMenuCards] = useState<MenuCard[]>([]);

  const SORT_OPTIONS = useMemo(
    () => [
      { value: 'default', label: t('sort.default') },
      { value: 'price-asc', label: t('sort.priceAsc') },
      { value: 'price-desc', label: t('sort.priceDesc') },
      { value: 'name', label: t('sort.name') },
    ],
    [t],
  );

  const menuCategories = useMemo(() => {
    const categories = new Map<string, string>();
    menuCards.forEach((card) => {
      if (card.categoryId && card.categoryName) {
        categories.set(card.categoryId, card.categoryName);
      }
    });
    return [
      { key: 'all', label: t('categories.allItems'), icon: TbLayoutGrid },
      ...Array.from(categories.entries()).map(([id, name], index) => ({
        key: id,
        label: name,
        icon: CATEGORY_ICONS[index % CATEGORY_ICONS.length],
      })),
    ];
  }, [menuCards, t]);

  useEffect(() => {
    setSessionToken(sessionId ?? null);
    setSession(null);
    setSessionUnavailable(false);
    setSessionLoading(true);
    if (sessionId) {
      clientAPI
        .getCurrentSession(sessionId)
        .then((sessionResponse) => {
          setSession(sessionResponse.data);
        })
        .catch(() => setSessionUnavailable(true))
        .finally(() => setSessionLoading(false));
    } else {
      setSessionUnavailable(true);
      setSessionLoading(false);
    }
    return () => setSessionToken(null);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    let active = true;
    void clientAPI
      .getPublicMenu()
      .then(({ data }) => {
        if (!active) return;
        setMenuCards(
          (data ?? []).map((product: ProductRecord) =>
            productToMenuCard(product, locale),
          ),
        );
      })
      .catch(() => {
        // Keep the last valid menu while a localized refresh is unavailable.
      });

    return () => {
      active = false;
    };
  }, [locale, sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    let active = true;
    const socket = createSocket(MENU_NAMESPACE, { sessionToken: sessionId });
    const refreshMenu = async () => {
      try {
        const { data } = await clientAPI.getPublicMenu();
        if (active) {
          setMenuCards(
            (data ?? []).map((product: ProductRecord) =>
              productToMenuCard(product, locale),
            ),
          );
        }
      } catch {
        // Keep the last valid menu; reconnecting will trigger another refresh.
      }
    };

    socket.on('connect', refreshMenu);
    socket.on(MENU_UPDATED_EVENT, refreshMenu);

    return () => {
      active = false;
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [locale, sessionId]);

  const { callWaiter } = useWaiterClient(sessionId);
  const { profileDataList } = useProfileData();

  const [images, setImages] = useState<MenuImage[]>([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [columnCount, setColumnCount] = useState(1);
  const pageSize = Math.ceil(MIN_PAGE_SIZE / columnCount) * columnCount;
  const [visible, setVisible] = useState(MIN_PAGE_SIZE);
  const [basket, setBasket] = useState<MenuCard[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuCard | null>(null);
  const [editingLine, setEditingLine] = useState<MenuCard | null>(null);
  const selectedItemId = selectedItem?.id;

  useEffect(() => {
    if (!selectedItemId) return;

    const updatedItem = menuCards.find((card) => card.id === selectedItemId);
    if (updatedItem) {
      setSelectedItem(updatedItem);
      return;
    }

    setSelectedItem(null);
    setEditingLine(null);
    setCardModalOpen(false);
  }, [menuCards, selectedItemId]);

  useEffect(() => {
    if (liveBasketItems) {
      setBasket(
        liveBasketItems.map((item) => basketItemToMenuCard(item, locale)),
      );
    }
  }, [liveBasketItems, locale]);

  useEffect(() => {
    setImages(loadMenuImages(menuCards));
  }, [menuCards]);

  const [fetchBasket] = useFetching(async () => {
    const { data: raw } = await clientAPI.getBasketItems();
    setBasket(
      (raw ?? []).map((item: BasketItemRecord) =>
        basketItemToMenuCard(item, locale),
      ),
    );
  });

  useEffect(() => {
    void fetchBasket();
  }, [fetchBasket, locale, sessionId]);

  // refresh basket whenever the detail modal closes (it may have added an item)
  useEffect(() => {
    if (!cardModalOpen) void fetchBasket();
  }, [cardModalOpen, fetchBasket]);

  const handleCallWaiter = useCallback(async () => {
    const result = await callWaiter();
    if (result.ok) message.success(t('dashboard.waiterCalled'));
    else message.error(t('dashboard.waiterFailed'));
  }, [callWaiter, message, t]);

  const cards = useMemo(() => {
    let list = [...menuCards];
    if (category !== 'all') {
      list = list.filter((card) => card.categoryId === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q));
    }
    switch (sort) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case 'name':
        list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    // Keep unavailable dishes visible but pushed to the end.
    return [...list].sort(
      (a, b) => Number(b.active) - Number(a.active),
    );
  }, [menuCards, category, search, sort]);

  // Reset pagination whenever the visible set changes.
  useEffect(() => {
    setVisible(pageSize);
  }, [search, sort, category, pageSize]);

  const shown = cards.slice(0, visible);
  const hasMore = cards.length > visible;

  const openDetail = (item: MenuCard) => {
    setSelectedItem(item);
    setEditingLine(null);
    setCardModalOpen(true);
  };

  // Open the popup to EDIT an existing cart line (pre-fills its sauces & qty).
  const openCartLine = (line: MenuCard) => {
    const menuCard = menuCards.find((c) => c.id === line.id) ?? line;
    openDetail(menuCard);
    setEditingLine(line);
  };

  const quickAdd = async (item: MenuCard) => {
    if (item.sauces?.length) {
      openDetail(item);
      return;
    }
    try {
      await clientAPI.addBasketItem({
        productId: item.id,
        sauceIds: [],
        quantity: 1,
      });
      await fetchBasket();
      message.success(t('dashboard.addedToBasket'));
    } catch {
      message.error(t('dashboard.serverError'));
    }
  };

  const changeCount = async (line: MenuCard, next: number) => {
    if (!line.basketItemId) return;
    await clientAPI.updateBasketItem(line.basketItemId, {
      quantity: Math.max(1, next),
    });
    await fetchBasket();
  };

  const removeItem = async (item: MenuCard) => {
    try {
      if (!item.basketItemId) return;
      await clientAPI.removeBasketItem(item.basketItemId);
      await fetchBasket();
    } catch {
      message.error(t('dashboard.deleteFailed'));
    }
  };

  const total = basket.reduce((sum, item) => sum + getMenuLineTotal(item), 0);
  const count = basket.reduce((n, it) => n + (it.count ?? 1), 0);
  const avatarInitial = (profileDataList.name?.[0] ?? 'N').toUpperCase();

  const [placeOrder] = useFetching(async () => {
    if (basket.length === 0) return;
    try {
      await clientAPI.placeOrder();
      setBasket([]);
      setCartOpen(false);
      message.success(t('dashboard.orderPlaced'));
    } catch {
      message.error(t('dashboard.orderFailed'));
    }
  });

  if (sessionLoading) {
    return <div className={css.closed}>{t('qr.opening')}</div>;
  }

  if (closed || sessionUnavailable || session?.status === 'closed') {
    setSessionToken(null);
    return (
      <div className={css.closed}>
        <div className={css.closedCard}>
          <span className={css.closedIcon}>🍽️</span>
          <h2>{t('closed.title')}</h2>
          <p>{t('closed.message')}</p>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{ token: { colorPrimary: '#e21d2c', colorInfo: '#e21d2c' } }}
    >
    <div className={css.page}>
      <div className={css.panel}>
        <header className={css.topbar}>
          <div className={css.tableChip}>
            <TbUser />
            <span>{t('dashboard.tableChip', { table: session?.table.number ?? '…' })}</span>
          </div>
          <LanguageSwitcher size="small" />
          <button
            type="button"
            className={css.callBtn}
            onClick={() => void handleCallWaiter()}
          >
            <TbBell /> {t('dashboard.callWaiter')}
          </button>
          <button
            type="button"
            className={css.orderToggle}
            onClick={() => setCartOpen(true)}
          >
            <TbShoppingCart />
            {t('dashboard.myOrder')}
            <span className={css.orderCount}>{count}</span>
          </button>
        </header>

        <div className={css.body}>
          <nav className={css.sidebar}>
            <ul className={css.navList}>
              {menuCategories.map(({ key, label, icon: Icon }) => (
                <li key={key}>
                  <button
                    type="button"
                    className={`${css.navItem} ${
                      category === key ? css.navItemActive : ''
                    }`}
                    onClick={() => setCategory(key)}
                  >
                    <Icon className={css.navIcon} />
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className={css.sidebarArt} aria-hidden>
              <img src="/images/leftIcon.png" alt="" className={css.sidebarArtImg} />
            </div>

            <div className={css.sidebarUser}>
              <span className={css.avatar}>{avatarInitial}</span>
              <span className={css.userNote}>
                <TbSun /> {t('dashboard.enjoyMeal')}
              </span>
            </div>
          </nav>

          <main className={`${css.menu} ss-scroll`}>
            <h2 className={css.menuTitle}>{t('dashboard.menuTitle')}</h2>

            <div className={css.tools}>
              <Input
                className={css.search}
                size="large"
                allowClear
                prefix={<TbSearch className={css.searchIcon} />}
                placeholder={t('dashboard.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select
                size="large"
                className={css.sort}
                value={sort}
                onChange={setSort}
                options={SORT_OPTIONS}
              />
            </div>

            <div className={css.tabs}>
              {menuCategories.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`${css.tab} ${
                    category === key ? css.tabActive : ''
                  }`}
                  onClick={() => setCategory(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <ClientMenuGrid
              items={shown}
              images={images}
              hasMore={hasMore}
              onOpen={openDetail}
              onQuickAdd={quickAdd}
              onLoadMore={() => setVisible((value) => value + pageSize)}
              onColumnCountChange={setColumnCount}
            />
          </main>
          <ClientOrderPanel
            open={cartOpen}
            basket={basket}
            images={images}
            total={total}
            onClose={() => setCartOpen(false)}
            onOpenItem={openCartLine}
            onChangeCount={changeCount}
            onRemove={removeItem}
            onPlaceOrder={placeOrder}
          />
        </div>
      </div>

      <ClientCardModal
        cardModalOpen={cardModalOpen}
        setCardModalOpen={setCardModalOpen}
        item={
          selectedItem
            ? menuCards.find((c) => c.id === selectedItem.id) ?? null
            : null
        }
        images={images}
        editItem={editingLine}
      />
    </div>
    </ConfigProvider>
  );
}
