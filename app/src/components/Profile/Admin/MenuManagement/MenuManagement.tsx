'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input, Select, Dropdown, Empty } from 'antd';
import { TbPlus, TbSearch, TbDotsVertical, TbCategory } from 'react-icons/tb';
import clientAPI from '@/api/api';
import { useFetching } from '@/hoc/fetchingHook';
import { useProfileData } from '@/context/ProfileDataContext';
import { useData } from '@/context/DataContext';
import { loadMenuImages } from '@/lib/menuImages';
import type { MenuCard, MenuImage } from '@/types';
import AddModal from '../Modal/AddModal';
import CardModal from '../Modal/CardModal/CardModal';
import css from './MenuManagement.module.css';

const CATEGORIES = ['All Items', 'Starters', 'Main Courses', 'Desserts', 'Drinks'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Sort by: Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A–Z' },
];

export default function MenuManagement() {
  const { profileDataList, fetchProfile } = useProfileData();
  const { setCardActive, cardActive } = useData();
  const [images, setImages] = useState<MenuImage[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState('All Items');
  const [addOpen, setAddOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuCard | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [editCard] = useFetching(async (card: Partial<MenuCard>) => {
    await clientAPI.editCard(card);
    await fetchProfile({ force: true });
  });

  const [fetchAddCard] = useFetching(async (formData: Partial<MenuCard>) => {
    await clientAPI.createCard(formData);
    await fetchProfile({ force: true });
  });

  useEffect(() => {
    if (profileDataList.card.length > 0) {
      setImages(loadMenuImages(profileDataList.card));
    }
  }, [profileDataList.card]);

  useEffect(() => {
    if (Object.keys(cardActive).length !== 0) {
      void editCard(cardActive);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardActive]);

  const cards = useMemo(() => {
    let list = [...(profileDataList.card ?? [])];
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
  }, [profileDataList.card, search, sort]);

  const openCard = (item: MenuCard, index: number) => {
    setSelectedItem(item);
    setSelectedIndex(index);
    setCardOpen(true);
  };

  const toggleActive = (item: MenuCard) => {
    setCardActive({ ...item, active: !item.active });
  };

  return (
    <div className={css.page}>
      <header className={css.header}>
        <div>
          <h1 className={css.title}>Menu Management</h1>
          <p className={css.subtitle}>
            Manage your restaurant menu and menu items
          </p>
        </div>
        <div className={css.headerActions}>
          <button type="button" className={css.btnGhost}>
            <TbCategory /> Categories
          </button>
          <button
            type="button"
            className={css.btnPrimary}
            onClick={() => setAddOpen(true)}
          >
            <TbPlus /> Add New Item
          </button>
        </div>
      </header>

      <div className={css.tabs}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`${css.tab} ${category === cat ? css.tabActive : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={css.toolbar}>
        <Input
          className={css.searchInput}
          size="large"
          allowClear
          prefix={<TbSearch className={css.searchIcon} />}
          placeholder="Search menu items..."
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
          <Empty description="No menu items" />
        </div>
      ) : (
        <div className={css.grid}>
          {cards.map((item, index) => {
            const src = images.find((im) => im.id === item.id)?.src;
            return (
              <article key={item.id} className={css.card}>
                <div
                  className={css.imgWrap}
                  onClick={() => openCard(item, index)}
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
                      onClick={() => openCard(item, index)}
                    >
                      {item.title}
                    </h3>
                    <Dropdown
                      trigger={['click']}
                      menu={{
                        items: [
                          {
                            key: 'edit',
                            label: 'Edit',
                            onClick: () => openCard(item, index),
                          },
                          {
                            key: 'toggle',
                            label: item.active
                              ? 'Mark unavailable'
                              : 'Mark available',
                            onClick: () => toggleActive(item),
                          },
                        ],
                      }}
                    >
                      <button type="button" className={css.dots}>
                        <TbDotsVertical />
                      </button>
                    </Dropdown>
                  </div>
                  <div className={css.price}>{item.price} դրամ</div>
                  <p className={css.desc}>{item.description}</p>
                  <button
                    type="button"
                    className={`${css.tag} ${
                      item.active ? css.tagOn : css.tagOff
                    }`}
                    onClick={() => toggleActive(item)}
                  >
                    {item.active ? 'Available' : 'Unavailable'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
