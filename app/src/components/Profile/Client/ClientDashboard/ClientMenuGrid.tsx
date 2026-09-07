import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { TbChevronDown, TbFlame, TbPlus, TbStar } from 'react-icons/tb';
import type { MenuCard, MenuImage } from '@/types';
import { formatAmount } from '@/lib/formatters';
import { getMenuBadge, type MenuBadge } from '@/lib/clientMenu';
import css from './ClientDashboard.module.css';

interface ClientMenuGridProps {
  items: MenuCard[];
  images: MenuImage[];
  hasMore: boolean;
  onOpen: (item: MenuCard, badge: MenuBadge) => void;
  onQuickAdd: (item: MenuCard, badge: MenuBadge) => Promise<void>;
  onLoadMore: () => void;
  onColumnCountChange: (columnCount: number) => void;
}

export default function ClientMenuGrid({ items, images, hasMore, onOpen, onQuickAdd, onLoadMore, onColumnCountChange }: ClientMenuGridProps) {
  const t = useTranslations('client');
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const updateColumnCount = () => {
      const template = window.getComputedStyle(grid).gridTemplateColumns;
      const columnCount = template === 'none'
        ? 1
        : template.split(' ').filter(Boolean).length;
      onColumnCountChange(Math.max(1, columnCount));
    };

    updateColumnCount();
    const observer = new ResizeObserver(updateColumnCount);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [onColumnCountChange]);

  return (
    <>
      <div ref={gridRef} className={css.grid}>
        {items.map((item, index) => {
          const src = images.find((image) => image.id === item.id)?.src;
          const badge = getMenuBadge(index);
          const unavailable = !item.active;
          return (
            <article key={item.id} className={`${css.card} ${unavailable ? css.cardDisabled : ''}`}>
              <button type="button" className={css.imgWrap} onClick={() => onOpen(item, badge)} disabled={unavailable} aria-label={item.title}>
                {src ? <img src={src} alt={item.title} loading="lazy" className={css.img} /> : <span className={css.imgFallback} />}
                {unavailable && <span className={css.unavailBadge}>{t('dashboard.outOfStock')}</span>}
                {!unavailable && badge === 'popular' && <span className={`${css.badge} ${css.badgePopular}`}><TbFlame /> {t('dashboard.badgePopular')}</span>}
                {!unavailable && badge === 'chef' && <span className={`${css.badge} ${css.badgeChef}`}><TbStar /> {t('dashboard.badgeChef')}</span>}
              </button>
              <div className={css.cardBody}>
                <button type="button" className={css.cardTitleButton} onClick={() => onOpen(item, badge)} disabled={unavailable}>
                  <h3 className={css.cardTitle}>{item.title}</h3>
                </button>
                <p className={css.cardDesc}>{item.description}</p>
                <div className={css.cardFoot}>
                  <span className={css.price}>{formatAmount(item.price)} ֏</span>
                  <button type="button" className={css.addBtn} disabled={unavailable} onClick={() => void onQuickAdd(item, badge)}>
                    {!unavailable && <TbPlus />} {unavailable ? t('dashboard.outOfStock') : t('dashboard.add')}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {hasMore && (
        <div className={css.loadMoreWrap}>
          <button type="button" className={css.loadMore} onClick={onLoadMore}><TbChevronDown /> {t('dashboard.loadMore')}</button>
        </div>
      )}
    </>
  );
}
