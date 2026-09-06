'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Input, Select, Dropdown, Empty } from 'antd';
import { TbPlus, TbSearch, TbDotsVertical } from 'react-icons/tb';
import clientAPI from '@/api/api';
import { useFetching } from '@/hoc/fetchingHook';
import { useProfileData } from '@/context/ProfileDataContext';
import { loadMenuImages } from '@/lib/menuImages';
import type { MenuCard, MenuImage } from '@/types';
import type { CategoryRecord } from '@/types/restaurant';
import AddModal from '../Modal/AddModal';
import CardModal from '../Modal/CardModal/CardModal';
import CategoryManagementPanel from './CategoryManagementModal';
import SauceManagementPanel from './SauceManagementModal';
import PageHeader from '@/components/Common/PageHeader/PageHeader';
import css from './MenuManagement.module.css';

type MenuSection = 'products' | 'categories' | 'sauces';

export default function MenuManagement() {
  const t = useTranslations('menu');
  const { profileDataList, fetchProfile, permissions } = useProfileData();
  const canManageCategories = permissions.includes('categories.manage');
  const canManageProducts = permissions.includes('products.manage');
  const [images, setImages] = useState<MenuImage[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [activeSection, setActiveSection] = useState<MenuSection>('products');
  const [addOpen, setAddOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuCard | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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
      ...(card.sauceIds !== undefined
        ? { sauceIds: card.sauceIds }
        : card.sauces !== undefined
          ? { sauceIds: card.sauces.map((sauce) => sauce.id) }
          : {}),
      ...(card.active !== undefined ? { isActive: card.active } : {}),
      ...(card.image !== undefined ? { image: card.image } : {}),
    });
    await fetchProfile({ force: true });
  });

  const [fetchAddCard] = useFetching(async (formData: Partial<MenuCard>) => {
    await clientAPI.createProduct({
      categoryId: formData.categoryId,
      titleTranslations: formData.titleTranslations,
      descriptionTranslations: formData.descriptionTranslations,
      price: formData.price,
      sauceIds: formData.sauceIds ?? [],
      isActive: formData.active ?? true,
      image: formData.image,
    });
    await fetchProfile({ force: true });
  });

  const loadCategories = async () => {
    const { data } = await clientAPI.getCategories();
    setCategories(data ?? []);
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (profileDataList.card.length > 0) {
      setImages(loadMenuImages(profileDataList.card));
    }
  }, [profileDataList.card]);

  const cards = useMemo(() => {
    let list = [...(profileDataList.card ?? [])];
    if (category !== 'all') {
      list = list.filter((card) => card.categoryId === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q));
    }
    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return list;
  }, [profileDataList.card, category, search, sort]);

  const openCard = (item: MenuCard, index: number) => {
    setSelectedItem(item);
    setSelectedIndex(index);
    setCardOpen(true);
  };

  const toggleActive = (item: MenuCard) => {
    void editCard({ id: item.id, active: !item.active });
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
            {[{ id: 'all', name: t('categories.all') }, ...categories].map(
              (cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`${css.tab} ${
                    category === cat.id ? css.tabActive : ''
                  }`}
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ),
            )}
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

          {cards.length === 0 ? (
            <div className={css.empty}>
              <Empty description={t('empty')} />
            </div>
          ) : (
            <div className={css.grid}>
              {cards.map((item, index) => {
                const src = images.find((im) => im.id === item.id)?.src;
                return (
                  <article key={item.id} className={css.card}>
                    <div
                      className={css.imgWrap}
                      onClick={() => canManageProducts && openCard(item, index)}
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
                            canManageProducts && openCard(item, index)
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
                                  onClick: () => openCard(item, index),
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
                      <div className={css.price}>
                        {t('price', { price: item.price })}
                      </div>
                      <p className={css.desc}>{item.description}</p>
                      <button
                        type="button"
                        className={`${css.tag} ${
                          item.active ? css.tagOn : css.tagOff
                        }`}
                        onClick={() => canManageProducts && toggleActive(item)}
                        disabled={!canManageProducts}
                      >
                        {item.active ? t('available') : t('unavailable')}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSection === 'categories' && canManageCategories && (
        <div className={css.sectionContent} role="tabpanel">
          <CategoryManagementPanel
            onChanged={() => {
              void loadCategories();
              void fetchProfile({ force: true });
            }}
          />
        </div>
      )}

      {activeSection === 'sauces' && canManageProducts && (
        <div className={css.sectionContent} role="tabpanel">
          <SauceManagementPanel
            onChanged={() => void fetchProfile({ force: true })}
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
            index={selectedIndex}
            item={selectedItem}
            images={images}
            fetchProfile={fetchProfile}
          />
        </>
      )}
    </div>
  );
}
