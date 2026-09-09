'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Input, Select, Dropdown, Empty, Switch } from 'antd';
import { TbPlus, TbSearch, TbDotsVertical } from 'react-icons/tb';
import clientAPI from '@/api/api';
import { useFetching } from '@/hoc/fetchingHook';
import { useProfileData } from '@/context/ProfileDataContext';
import { loadMenuImages } from '@/lib/menuImages';
import type { MenuCard } from '@/types';
import type { ProductRecord } from '@/types/restaurant';
import AddModal from '../Modal/AddModal';
import CardModal from '../Modal/CardModal/CardModal';
import CategoryManagementPanel from './CategoryManagementModal';
import SauceManagementPanel from './SauceManagementModal';
import PageHeader from '@/components/Common/PageHeader/PageHeader';
import css from './MenuManagement.module.css';
import { productToMenuCard } from '@/lib/normalizeMenuCard';
import { useDebouncedValue, useServerList } from '@/hooks/useServerList';
import RemoteSelect from '@/components/Common/RemoteSelect';
import ListPagination from '@/components/Common/ListPagination';
import { createSocket } from '@/lib/ws/socket';

type MenuSection = 'products' | 'categories' | 'sauces';

export default function MenuManagement() {
  const t = useTranslations('menu');
  const locale = useLocale();
  const { permissions } = useProfileData();
  const listT = useTranslations('common.list');
  const canManageCategories = permissions.includes('categories.manage');
  const canManageProducts = permissions.includes('products.manage');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState('all');
  const [activeSection, setActiveSection] = useState<MenuSection>('products');
  const [addOpen, setAddOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuCard | null>(null);
  const [sauce, setSauce] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const debouncedSearch = useDebouncedValue(search);
  const filterKey = JSON.stringify([category, sauce, sort, debouncedSearch, pageSize]);
  const [pageKey, setPageKey] = useState(filterKey);
  const productList = useServerList<ProductRecord>('/api/lists/products', {
    page: filterKey === pageKey ? page : 1, pageSize, search: debouncedSearch, sort,
    categoryId: category === 'all' ? undefined : category,
    sauceId: sauce === 'all' ? undefined : sauce,
  }, permissions.includes('menu.view') && activeSection === 'products');
  const fetchProfile = productList.refresh;
  const refreshRef = useRef(fetchProfile);
  refreshRef.current = fetchProfile;
  const cards = useMemo(() => (productList.data?.items ?? []).map(item => productToMenuCard(item, locale)), [productList.data, locale]);
  const images = useMemo(() => loadMenuImages([...cards, ...(selectedItem ? [selectedItem] : [])]), [cards, selectedItem]);
  useEffect(() => {
    if (!permissions.includes('menu.view')) return;
    const socket = createSocket('/menu');
    const refreshCurrentPage = () => { void refreshRef.current(); };
    socket.on('connect', refreshCurrentPage);
    socket.on('menu:updated', refreshCurrentPage);
    return () => { socket.removeAllListeners(); socket.disconnect(); };
  }, [permissions]);


  const [editCard] = useFetching(async (card: Partial<MenuCard>) => {
    if (!card.id) return;
    await clientAPI.updateProduct(card.id, {
      ...(card.categoryId !== undefined ? { categoryId: card.categoryId } : {}),
      ...(card.title !== undefined ? { title: card.title } : {}),
      ...(card.titleTranslations !== undefined
        ? { titleTranslations: card.titleTranslations }
        : {}),
      ...(card.description !== undefined
        ? { description: card.description }
        : {}),
      ...(card.descriptionTranslations !== undefined
        ? { descriptionTranslations: card.descriptionTranslations }
        : {}),
      ...(card.price !== undefined ? { price: card.price } : {}),
      ...(card.stockQuantity !== undefined
        ? { stockQuantity: card.stockQuantity }
        : {}),
      ...(card.sauceIds !== undefined
        ? { sauceIds: card.sauceIds }
        : card.sauces !== undefined
          ? { sauceIds: card.sauces.map((sauce) => sauce.id) }
          : {}),
      ...(card.active !== undefined ? { isActive: card.active } : {}),
      ...(card.image !== undefined ? { image: card.image } : {}),
    });
    await fetchProfile();
  });

  const [fetchAddCard] = useFetching(async (formData: Partial<MenuCard>) => {
    await clientAPI.createProduct({
      categoryId: formData.categoryId,
      titleTranslations: formData.titleTranslations,
      descriptionTranslations: formData.descriptionTranslations,
      price: formData.price,
      stockQuantity: formData.stockQuantity,
      sauceIds: formData.sauceIds ?? [],
      isActive: formData.active ?? true,
      image: formData.image,
    });
    await fetchProfile();
  });

  useEffect(() => {
    if (!selectedItem) return;
    const current = cards.find(item => item.id === selectedItem.id);
    if (current && current !== selectedItem) setSelectedItem(current);
  }, [cards, selectedItem]);

  const openCard = (item: MenuCard) => {
    setSelectedItem(item);
    setCardOpen(true);
  };

  const toggleActive = async (item: MenuCard) => {
    const active = !item.active;
    const succeeded = await editCard({ id: item.id, active });
    if (succeeded) {
      setSelectedItem((current) =>
        current?.id === item.id ? { ...current, active } : current,
      );
    }
  };

  const SORT_OPTIONS = [
    { value: 'newest', label: t('sort.newest') },
    { value: 'price-asc', label: t('sort.priceAsc') },
    { value: 'price-desc', label: t('sort.priceDesc') },
    { value: 'name', label: t('sort.name') },
  ];

  return (
    <div className={css.page}>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          canManageProducts && activeSection === 'products' ? (
            <button
              type="button"
              className={css.btnPrimary}
              onClick={() => setAddOpen(true)}
            >
              <TbPlus /> {t('addNewItem')}
            </button>
          ) : null
        }
      />

      <div className={css.sectionTabs} role="tablist" aria-label={t('title')}>
        <button
          type="button"
          role="tab"
          aria-selected={activeSection === 'products'}
          className={`${css.sectionTab} ${
            activeSection === 'products' ? css.sectionTabActive : ''
          }`}
          onClick={() => setActiveSection('products')}
        >
          {t('productsButton')}
        </button>
        {canManageCategories && (
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'categories'}
            className={`${css.sectionTab} ${
              activeSection === 'categories' ? css.sectionTabActive : ''
            }`}
            onClick={() => setActiveSection('categories')}
          >
            {t('categoriesButton')}
          </button>
        )}
        {canManageProducts && (
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'sauces'}
            className={`${css.sectionTab} ${
              activeSection === 'sauces' ? css.sectionTabActive : ''
            }`}
            onClick={() => setActiveSection('sauces')}
          >
            {t('saucesButton')}
          </button>
        )}
      </div>

      {activeSection === 'products' && (
        <div className={css.sectionContent} role="tabpanel">
          <div className={css.tabs}>
            <RemoteSelect resource="categories" value={category} onChange={setCategory}
              allLabel={listT('allCategories')} aria-label={listT('allCategories')} style={{ minWidth: 200, flex: 1 }} />
            <RemoteSelect resource="sauces" value={sauce} onChange={setSauce}
              allLabel={listT('allSauces')} aria-label={listT('allSauces')} style={{ minWidth: 200, flex: 1 }} />
          </div>

          <div className={css.toolbar}>
            <Input
              className={css.searchInput}
              size="large"
              allowClear
              prefix={<TbSearch className={css.searchIcon} />}
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              size="large"
              className={css.sortSelect}
              value={sort}
              onChange={setSort}
              options={SORT_OPTIONS}
            />
          </div>

          {cards.length === 0 && !productList.loading && !productList.error ? (
            <div className={css.empty}>
              <Empty description={t('empty')} />
            </div>
          ) : (
            <div className={css.grid}>
              {cards.map((item) => {
                const src = images.find((im) => im.id === item.id)?.src;
                return (
                  <article key={item.id} className={css.card}>
                    <div
                      className={css.imgWrap}
                      onClick={() => canManageProducts && openCard(item)}
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
                    </div>
                    <div className={css.body}>
                      <div className={css.topRow}>
                        <h3
                          className={css.cardTitle}
                          onClick={() =>
                            canManageProducts && openCard(item)
                          }
                        >
                          {item.title}
                        </h3>
                        {canManageProducts && (
                          <Dropdown
                            trigger={['click']}
                            menu={{
                              items: [
                                {
                                  key: 'edit',
                                  label: t('edit'),
                                  onClick: () => openCard(item),
                                },
                                {
                                  key: 'toggle',
                                  label: item.active
                                    ? t('markUnavailable')
                                    : t('markAvailable'),
                                  onClick: () => toggleActive(item),
                                },
                              ],
                            }}
                          >
                            <button type="button" className={css.dots}>
                              <TbDotsVertical />
                            </button>
                          </Dropdown>
                        )}
                      </div>
                      <div className={css.productMeta}>
                        <div className={css.price}>
                          {t('price', { price: item.price })}
                        </div>
                        <span className={css.stock}>
                          {item.stockQuantity === null ||
                          item.stockQuantity === undefined
                            ? t('stockNotSet')
                            : t('stock', { count: item.stockQuantity })}
                        </span>
                      </div>
                      <p className={css.desc}>{item.description}</p>
                      <div className={css.availabilityControl}>
                        <div>
                          <span>{t('availability')}</span>
                          <strong
                            className={item.active ? css.tagOn : css.tagOff}
                          >
                            {item.active ? t('available') : t('unavailable')}
                          </strong>
                        </div>
                        <Switch
                          size="small"
                          checked={item.active}
                          disabled={!canManageProducts}
                          onChange={() => void toggleActive(item)}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <ListPagination data={productList.data} loading={productList.loading} error={productList.error}
            onRetry={fetchProfile} onChange={(nextPage, size) => {
              setPage(nextPage); setPageSize(size);
              setPageKey(JSON.stringify([category, sauce, sort, debouncedSearch, size]));
            }} />
        </div>
      )}

      {activeSection === 'categories' && canManageCategories && (
        <div className={css.sectionContent} role="tabpanel">
          <CategoryManagementPanel
            onChanged={() => {
              void fetchProfile();
            }}
          />
        </div>
      )}

      {activeSection === 'sauces' && canManageProducts && (
        <div className={css.sectionContent} role="tabpanel">
          <SauceManagementPanel
            onChanged={() => void fetchProfile()}
          />
        </div>
      )}

      {canManageProducts && (
        <>
          <AddModal
            modalOpen={addOpen}
            setModalOpen={setAddOpen}
            fetchAddCard={fetchAddCard}
          />
          <CardModal
            cardModalOpen={cardOpen}
            setCardModalOpen={setCardOpen}
            item={selectedItem}
            images={images}
            fetchProfile={fetchProfile}
            onToggleActive={toggleActive}
          />
        </>
      )}
    </div>
  );
}
