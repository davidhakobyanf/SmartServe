'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { App, Input, Select, ConfigProvider } from 'antd';
import {
  TbUser,
  TbBell,
  TbShoppingCart,
  TbPlus,
  TbMinus,
  TbTrash,
  TbX,
  TbSearch,
  TbLayoutGrid,
  TbSoup,
  TbMeat,
  TbCake,
  TbGlassFull,
  TbFlame,
  TbStar,
  TbChevronDown,
  TbSun,
  TbLock,
  TbArrowRight,
} from 'react-icons/tb';
import css from './ClientDashboard.module.css';
import { useProfileData } from '@/context/ProfileDataContext';
import { useFetching } from '@/hoc/fetchingHook';
import clientAPI, { setSessionToken } from '@/api/api';
import ClientCardModal from '../ClientCardModal/ClientCardModal';
import { loadMenuImages } from '@/lib/menuImages';
import { normalizeMenuCard } from '@/lib/normalizeMenuCard';
import type { MenuCard, MenuImage } from '@/types';
import type { DiningSession } from '@/types/tables';
import { useWaiterClient } from '@/hooks/useWaiterClient';
import { useSessionLock } from '@/hooks/useSessionLock';
import LanguageSwitcher from '@/components/LanguageSwitcher/LanguageSwitcher';

const SAUCE_PRICE = 350;

const PAGE_SIZE = 8;

const CATEGORIES = [
  { key: 'All Items', tKey: 'allItems', icon: TbLayoutGrid },
  { key: 'Starters', tKey: 'starters', icon: TbSoup },
  { key: 'Main Courses', tKey: 'mainCourses', icon: TbMeat },
  { key: 'Desserts', tKey: 'desserts', icon: TbCake },
  { key: 'Drinks', tKey: 'drinks', icon: TbGlassFull },
];

// Purely cosmetic ribbon that mirrors the reference design.
const badgeFor = (index: number): 'popular' | 'chef' | null => {
  if (index % 4 === 0) return 'popular';
  if (index % 4 === 1) return 'chef';
  return null;
};

const lineTotal = (item: MenuCard) =>
  item.price * (item.count ?? 1) + SAUCE_PRICE * (item.sauces?.length ?? 0);

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default function ClientDashboard() {
  const t = useTranslations('client');
  const { message } = App.useApp();
  const params = useParams();
  const sessionId = params?.clientId as string;
  const { closed } = useSessionLock(sessionId ?? null);
  const [session, setSession] = useState<DiningSession | null>(null);
  const [sessionUnavailable, setSessionUnavailable] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  const SORT_OPTIONS = useMemo(
    () => [
      { value: 'popular', label: t('sort.popular') },
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
        .then(({ data }) => setSession(data))
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
  const [category, setCategory] = useState('All Items');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [basket, setBasket] = useState<MenuCard[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuCard | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<'popular' | 'chef' | null>(
    null,
  );
  const [editingLine, setEditingLine] = useState<MenuCard | null>(null);

  useEffect(() => {
    if (profileDataList.card.length > 0) {
      setImages(loadMenuImages(profileDataList.card));
    }
  }, [profileDataList.card]);

  const [fetchBasket] = useFetching(async () => {
    const { data: raw } = await clientAPI.getMine();
    setBasket((raw ?? []).map((item) => normalizeMenuCard(item)));
  });

  useEffect(() => {
    void fetchBasket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // refresh basket whenever the detail modal closes (it may have added an item)
  useEffect(() => {
    if (!cardModalOpen) void fetchBasket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardModalOpen]);

  const handleCallWaiter = useCallback(async () => {
    const result = await callWaiter();
    if (result.ok) message.success(t('dashboard.waiterCalled'));
    else message.error(t('dashboard.waiterFailed'));
  }, [callWaiter, message, t]);

  const cards = useMemo(() => {
    let list = [...(profileDataList.card ?? [])];
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
  }, [profileDataList.card, search, sort]);

  // Reset pagination whenever the visible set changes.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [search, sort, category]);

  const shown = cards.slice(0, visible);
  const hasMore = cards.length > visible;

  const openDetail = (
    item: MenuCard,
    badge: 'popular' | 'chef' | null = null,
  ) => {
    const idx = profileDataList.card.findIndex((c) => c.id === item.id);
    setSelectedItem(item);
    setSelectedIndex(idx >= 0 ? idx : null);
    setSelectedBadge(badge);
    setEditingLine(null);
    setCardModalOpen(true);
  };

  // Open the popup to EDIT an existing cart line (pre-fills its sauces & qty).
  const openCartLine = (line: MenuCard) => {
    const menuCard = profileDataList.card.find((c) => c.id === line.id) ?? line;
    openDetail(menuCard, null);
    setEditingLine(line);
  };

  const quickAdd = async (
    item: MenuCard,
    badge: 'popular' | 'chef' | null = null,
  ) => {
    if (item.sauces?.length) {
      openDetail(item, badge);
      return;
    }
    try {
      await clientAPI.createBasket({
        ...item,
        sauces: [],
        count: 1,
      });
      await fetchBasket();
      message.success(t('dashboard.addedToBasket'));
    } catch {
      message.error(t('dashboard.serverError'));
    }
  };

  // A basket line is unique per (id + sauces), never by id alone.
  const lineKey = (it: MenuCard) =>
    `${it.id}|${JSON.stringify(it.sauces ?? [])}`;

  const changeCount = (line: MenuCard, next: number) => {
    const key = lineKey(line);
    setBasket((prev) =>
      prev.map((it) =>
        lineKey(it) === key ? { ...it, count: Math.max(1, next) } : it,
      ),
    );
  };

  const removeItem = async (item: MenuCard) => {
    try {
      await clientAPI.deleteBasket(item.id, item.sauces ?? []);
      await fetchBasket();
    } catch {
      message.error(t('dashboard.deleteFailed'));
    }
  };

  const total = basket.reduce((sum, it) => sum + lineTotal(it), 0);
  const count = basket.reduce((n, it) => n + (it.count ?? 1), 0);
  const avatarInitial = (profileDataList.name?.[0] ?? 'N').toUpperCase();

  const [placeOrder] = useFetching(async () => {
    if (basket.length === 0) return;
    const items = basket.map((it) => ({
      id: it.id,
      title: it.title,
      description: it.description,
      price: lineTotal(it),
      sauces: it.sauces ?? [],
      active: it.active,
      image: it.image,
      count: it.count ?? 1,
    }));
    const allPrice = items.reduce((t, it) => t + it.price, 0);
    try {
      await clientAPI.createOrder({ items, allPrice });
      await clientAPI.clearMine();
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
              {CATEGORIES.map(({ key, tKey, icon: Icon }) => (
                <li key={key}>
                  <button
                    type="button"
                    className={`${css.navItem} ${
                      category === key ? css.navItemActive : ''
                    }`}
                    onClick={() => setCategory(key)}
                  >
                    <Icon className={css.navIcon} />
                    <span>{t(`categories.${tKey}`)}</span>
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
              {CATEGORIES.map(({ key, tKey }) => (
                <button
                  key={key}
                  type="button"
                  className={`${css.tab} ${
                    category === key ? css.tabActive : ''
                  }`}
                  onClick={() => setCategory(key)}
                >
                  {t(`categories.${tKey}`)}
                </button>
              ))}
            </div>

            <div className={css.grid}>
              {shown.map((item, i) => {
                const src = images.find((im) => im.id === item.id)?.src;
                const badge = badgeFor(i);
                const unavailable = !item.active;
                return (
                  <article
                    key={item.id}
                    className={`${css.card} ${
                      unavailable ? css.cardDisabled : ''
                    }`}
                  >
                    <div
                      className={css.imgWrap}
                      onClick={() => !unavailable && openDetail(item, badge)}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={item.title}
                          loading="lazy"
                          className={css.img}
                        />
                      ) : (
                        <div className={css.imgFallback} />
                      )}
                      {unavailable && (
                        <span className={css.unavailBadge}>{t('dashboard.outOfStock')}</span>
                      )}
                      {!unavailable && badge === 'popular' && (
                        <span className={`${css.badge} ${css.badgePopular}`}>
                          <TbFlame /> {t('dashboard.badgePopular')}
                        </span>
                      )}
                      {!unavailable && badge === 'chef' && (
                        <span className={`${css.badge} ${css.badgeChef}`}>
                          <TbStar /> {t('dashboard.badgeChef')}
                        </span>
                      )}
                    </div>
                    <div className={css.cardBody}>
                      <h3
                        className={css.cardTitle}
                        onClick={() => !unavailable && openDetail(item, badge)}
                      >
                        {item.title}
                      </h3>
                      <p className={css.cardDesc}>{item.description}</p>
                      <div className={css.cardFoot}>
                        <span className={css.price}>{fmt(item.price)} ֏</span>
                        {unavailable ? (
                          <button
                            type="button"
                            className={css.addBtn}
                            disabled
                          >
                            {t('dashboard.outOfStock')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={css.addBtn}
                            onClick={() => void quickAdd(item, badge)}
                          >
                            <TbPlus /> {t('dashboard.add')}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMore && (
              <div className={css.loadMoreWrap}>
                <button
                  type="button"
                  className={css.loadMore}
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  <TbChevronDown /> {t('dashboard.loadMore')}
                </button>
              </div>
            )}
          </main>

          <aside className={`${css.order} ${cartOpen ? css.orderOpen : ''}`}>
            <div className={css.orderHead}>
              <h3>{t('order.title')}</h3>
              <button
                type="button"
                className={css.orderClose}
                onClick={() => setCartOpen(false)}
              >
                <TbX />
              </button>
            </div>

            <div className={`${css.orderList} ss-scroll`}>
              {basket.length === 0 ? (
                <div className={css.orderEmpty}>
                  <TbShoppingCart />
                  <p>{t('order.empty')}</p>
                </div>
              ) : (
                basket.map((it) => {
                  const src = images.find((im) => im.id === it.id)?.src;
                  return (
                    <div key={lineKey(it)} className={css.orderItem}>
                      {src ? (
                        <img
                          src={src}
                          alt={it.title}
                          className={css.orderThumb}
                          onClick={() => openCartLine(it)}
                        />
                      ) : (
                        <div
                          className={css.orderThumbFallback}
                          onClick={() => openCartLine(it)}
                        />
                      )}
                      <div className={css.orderItemInfo}>
                        <div className={css.orderItemTop}>
                          <span
                            className={css.orderItemName}
                            onClick={() => openCartLine(it)}
                          >
                            {it.title}
                          </span>
                          <button
                            type="button"
                            className={css.removeBtn}
                            onClick={() => void removeItem(it)}
                          >
                            <TbTrash />
                          </button>
                        </div>
                        <span className={css.orderItemPrice}>
                          {fmt(lineTotal(it))} ֏
                        </span>
                        <div className={css.stepper}>
                          <button
                            type="button"
                            onClick={() => changeCount(it, (it.count ?? 1) - 1)}
                          >
                            <TbMinus />
                          </button>
                          <span>{it.count ?? 1}</span>
                          <button
                            type="button"
                            onClick={() => changeCount(it, (it.count ?? 1) + 1)}
                          >
                            <TbPlus />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={css.orderFooter}>
              <div className={css.totalRow}>
                <span>{t('order.total')}</span>
                <span className={css.totalValue}>{fmt(total)} ֏</span>
              </div>
              <button
                type="button"
                className={css.placeBtn}
                disabled={basket.length === 0}
                onClick={() => void placeOrder()}
              >
                <TbLock className={css.placeLock} />
                {t('order.placeOrder')}
                <TbArrowRight className={css.placeArrow} />
              </button>
              <p className={css.kitchenNote}>
                <TbLock /> {t('order.kitchenNote')}
              </p>
            </div>
          </aside>

          {cartOpen && (
            <div className={css.backdrop} onClick={() => setCartOpen(false)} />
          )}
        </div>
      </div>

      <ClientCardModal
        cardModalOpen={cardModalOpen}
        setCardModalOpen={setCardModalOpen}
        index={selectedIndex}
        item={
          selectedItem
            ? profileDataList.card.find((c) => c.id === selectedItem.id) ?? null
            : null
        }
        images={images}
        badge={selectedBadge}
        editItem={editingLine}
      />
    </div>
    </ConfigProvider>
  );
}
