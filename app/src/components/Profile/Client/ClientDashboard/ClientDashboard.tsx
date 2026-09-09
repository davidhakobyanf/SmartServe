'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { App, Input, Select, ConfigProvider } from 'antd';
import {
  TbUser,
  TbBell,
  TbShoppingCart,
  TbClipboardList,
  TbSearch,
  TbFilter,
  TbSun,
} from 'react-icons/tb';
import css from './ClientDashboard.module.css';
import { useProfileData } from '@/context/ProfileDataContext';
import { useFetching } from '@/hoc/fetchingHook';
import clientAPI, { apiClient, setSessionToken } from '@/api/api';
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
import { useClientOrders } from '@/hooks/useClientOrders';
import LanguageSwitcher from '@/components/LanguageSwitcher/LanguageSwitcher';
import { getMenuLineTotal } from '@/lib/clientMenu';
import { createSocket } from '@/lib/ws/socket';
import ClientMenuGrid from './ClientMenuGrid';
import ClientOrderPanel from './ClientOrderPanel';
import { useDebouncedValue, useServerList } from '@/hooks/useServerList';
import ListPagination from '@/components/Common/ListPagination';
import RemoteSelect from '@/components/Common/RemoteSelect';

const MENU_NAMESPACE = '/menu';
const MENU_UPDATED_EVENT = 'menu:updated';


export default function ClientDashboard() {
  const t = useTranslations('client');
  const listT = useTranslations('common.list');
  const locale = useLocale();
  const { message } = App.useApp();
  const params = useParams();
  const sessionId = params?.clientId as string;
  const { closed, basketItems: liveBasketItems, orders: liveOrders, orderChange, connectionVersion } = useSessionLock(
    sessionId ?? null,
  );
  const [session, setSession] = useState<DiningSession | null>(null);
  const [sessionUnavailable, setSessionUnavailable] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const { orders, total: ordersTotal, pageData: ordersPage, onPageChange: onOrdersPageChange, loading: ordersLoading, error: ordersError, refreshOrders } = useClientOrders(
    sessionId, Boolean(session && session.id === sessionId && !closed && !sessionUnavailable && session.status === 'open'), liveOrders, connectionVersion, orderChange,
  );

  const SORT_OPTIONS = useMemo(
    () => [
      { value: 'default', label: t('sort.default') },
      { value: 'price-asc', label: t('sort.priceAsc') },
      { value: 'price-desc', label: t('sort.priceDesc') },
      { value: 'name', label: t('sort.name') },
    ],
    [t],
  );

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

  const { callWaiter } = useWaiterClient(sessionId);
  const { profileDataList } = useProfileData();

  const [images, setImages] = useState<MenuImage[]>([]);
  const [category, setCategory] = useState('all');
  const menuRef = useRef<HTMLElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [sauce, setSauce] = useState('all');
  const filtersActive = category !== 'all' || sauce !== 'all' || Boolean(search.trim());

  const returnToResults = () => {
    const menu = menuRef.current;
    const filter = filterRef.current;
    const results = resultsRef.current;
    if (!menu || !filter || !results) return;
    const hiddenDistance = filter.getBoundingClientRect().bottom - results.getBoundingClientRect().top;
    if (hiddenDistance > 0) menu.scrollTop = Math.max(0, menu.scrollTop - hiddenDistance);
  };

  const changeCategory = (value: string) => {
    returnToResults();
    setCategory(value);
  };

  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const debouncedSearch = useDebouncedValue(search);
  const filterKey = JSON.stringify([debouncedSearch, sort, category, sauce, pageSize]);
  const [pageKey, setPageKey] = useState(filterKey);
  const sessionReady = Boolean(session && session.id === sessionId && !closed && !sessionUnavailable);
  const menuList = useServerList<ProductRecord>('/api/guest-lists/products', {
    page: pageKey === filterKey ? page : 1, pageSize, search: debouncedSearch, sort,
    categoryId: category === 'all' ? undefined : category,
    sauceId: sauce === 'all' ? undefined : sauce,
  }, sessionReady, sessionId);
  const menuCards = useMemo(() => (menuList.data?.items ?? []).map(item => productToMenuCard(item, locale)), [menuList.data, locale]);
  const refreshMenu = menuList.refresh;
  const refreshMenuRef = useRef(refreshMenu);
  refreshMenuRef.current = refreshMenu;
  useEffect(() => {
    if (!sessionReady) return;
    const socket = createSocket(MENU_NAMESPACE, { sessionToken: sessionId });
    const refreshCurrentPage = () => { void refreshMenuRef.current(); };
    socket.on('connect', refreshCurrentPage);
    socket.on(MENU_UPDATED_EVENT, refreshCurrentPage);
    return () => { socket.removeAllListeners(); socket.disconnect(); };
  }, [sessionId, sessionReady]);
  const [basket, setBasket] = useState<MenuCard[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderTab, setOrderTab] = useState<'basket' | 'orders'>('basket');
  const placingRef = useRef(false);
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

  }, [menuCards, selectedItemId]);

  useEffect(() => {
    if (liveBasketItems) {
      setBasket(
        liveBasketItems.map((item) => basketItemToMenuCard(item, locale)),
      );
    }
  }, [liveBasketItems, locale]);

  useEffect(() => {
    setImages(loadMenuImages([...menuCards, ...basket, ...(selectedItem ? [selectedItem] : [])]));
  }, [menuCards, basket, selectedItem]);

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

  const openDetail = (item: MenuCard) => {
    setSelectedItem(item);
    setEditingLine(null);
    setCardModalOpen(true);
  };

  // Open the popup to EDIT an existing cart line (pre-fills its sauces & qty).
  const openCartLine = async (line: MenuCard) => {
    try {
      const { data } = await apiClient.get('/api/guest-lists/products', { params: { id: line.id, pageSize: 1 } });
      if (!data.items[0]) { message.error(t('dashboard.outOfStock')); return; }
      openDetail(productToMenuCard(data.items[0], locale));
      setEditingLine(line);
    } catch { message.error(t('dashboard.serverError')); }
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

  const [placeOrder, placing] = useFetching(async () => {
    if (basket.length === 0 || placingRef.current) return;
    placingRef.current = true;
    try {
      await clientAPI.placeOrder();
      setBasket([]);
      setOrderTab('orders');
      setCartOpen(true);
      message.success(t('dashboard.orderPlaced'));
      await refreshOrders();
    } catch {
      message.error(t('dashboard.orderFailed'));
    } finally {
      placingRef.current = false;
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
          <div className={css.orderActions}>
          <button
            type="button"
            className={css.orderToggle}
            onClick={() => { setOrderTab('basket'); setCartOpen(true); }}
          >
            <TbShoppingCart />
            {t('history.basket')}
            <span className={css.orderCount}>{count}</span>
          </button>
          <button type="button" className={css.orderToggle} onClick={() => { setOrderTab('orders'); setCartOpen(true); }}>
            <TbClipboardList /> {t('history.title')}
            <span className={css.orderCount}>{ordersTotal}</span>
          </button>
          </div>
        </header>

        <div className={css.body}>
          <nav className={css.sidebar}>
            <RemoteSelect resource="categories" guest enabled={sessionReady}
              aria-label={t('filters.category')} value={category} onChange={changeCategory}
              allLabel={t('categories.allItems')} style={{ width: '100%' }} />

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

          <main ref={menuRef} className={`${css.menu} ss-scroll`}>
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

            <div ref={filterRef} className={`${css.categoryFilter} ${filtersActive ? css.categoryFilterActive : ''}`}>
              <label className={css.categoryLabel} htmlFor="menu-category">
                <TbFilter aria-hidden="true" /> {t('filters.category')}
                {filtersActive && <span className={css.filterBadge}>{t('filters.active')}</span>}
              </label>
              <RemoteSelect
                resource="categories" guest enabled={sessionReady}
                allLabel={t('categories.allItems')}
                id="menu-category"
                aria-label={t('filters.category')}
                size="large"
                className={css.categorySelect}
                value={category}
                onChange={changeCategory}
              />
              <RemoteSelect resource="sauces" guest enabled={sessionReady}
                value={sauce} onChange={(value) => { returnToResults(); setSauce(value); }}
                allLabel={listT('allSauces')} aria-label={listT('allSauces')}
                style={{ width: '100%', marginTop: 8 }} />
              {filtersActive && (
                <div className={css.filterSummary}>
                  <span role="status">{t('filters.matching', { count: menuList.data?.total ?? 0, total: menuList.data?.unfilteredTotal ?? 0 })}</span>
                  <button type="button" className={css.clearFilters} onClick={() => {
                    returnToResults();
                    setCategory('all');
                    setSearch('');
                    setSauce('all');
                  }}>{t('filters.showAll')}</button>
                </div>
              )}
            </div>

            <div ref={resultsRef}>
            {!menuList.loading && !menuList.error && menuCards.length === 0 && filtersActive && <p className={css.noResults}>{t('filters.empty')}</p>}
            <ClientMenuGrid
              items={menuCards}
              images={images}
              hasMore={false}
              onOpen={openDetail}
              onQuickAdd={quickAdd}
              onLoadMore={() => {}}
            />
            <ListPagination data={menuList.data} loading={menuList.loading} error={menuList.error}
              onRetry={refreshMenu} onChange={(nextPage, size) => {
                setPageKey(JSON.stringify([debouncedSearch, sort, category, sauce, size]));
                setPage(nextPage); setPageSize(size); returnToResults();
              }} />
            </div>
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
            placing={placing}
            tab={orderTab}
            onTabChange={setOrderTab}
            orders={orders}
            ordersTotal={ordersTotal}
            historyPagination={<ListPagination data={ordersPage} loading={ordersLoading} error={ordersError} onRetry={refreshOrders} onChange={onOrdersPageChange} />}
            ordersLoading={ordersLoading}
            ordersError={ordersError}
            onRefreshOrders={refreshOrders}
          />
        </div>
      </div>

      <ClientCardModal
        cardModalOpen={cardModalOpen}
        setCardModalOpen={setCardModalOpen}
        item={selectedItem}
        images={images}
        editItem={editingLine}
      />
    </div>
    </ConfigProvider>
  );
}
