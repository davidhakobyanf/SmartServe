import { useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { TbChevronDown, TbMinus } from 'react-icons/tb';
import type { MenuCard, MenuImage } from '@/types';
import { formatAmount } from '@/lib/formatters';
import { PlusIcon } from '@/components/Common/InterfaceIcons';
import SkeletonImage from '@/components/Common/SkeletonImage/SkeletonImage';
import css from './ClientDashboard.module.css';

interface ClientMenuGridProps {
  items: MenuCard[];
  images: MenuImage[];
  basket: MenuCard[];
  hasMore: boolean;
  onOpen: (item: MenuCard) => void;
  onQuickAdd: (item: MenuCard) => Promise<void>;
  onDecrease: (lines: MenuCard[]) => void;
  onLoadMore: () => void;
  onColumnCountChange?: (columnCount: number) => void;
}

export default function ClientMenuGrid({ items, images, basket, hasMore, onOpen, onQuickAdd, onDecrease, onLoadMore, onColumnCountChange }: ClientMenuGridProps) {
  const t = useTranslations('client');
  const gridRef = useRef<HTMLDivElement>(null);
  const basketByProduct = useMemo(() => {
    const lines = new Map<string, MenuCard[]>();
    for (const line of basket) {
      const productLines = lines.get(line.id) ?? [];
      productLines.push(line);
      lines.set(line.id, productLines);
    }
    return lines;
  }, [basket]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const updateColumnCount = () => {
      const template = window.getComputedStyle(grid).gridTemplateColumns;
      const columnCount = template === 'none'
        ? 1
        : template.split(' ').filter(Boolean).length;
      onColumnCountChange?.(Math.max(1, columnCount));
    };

    updateColumnCount();
    const observer = new ResizeObserver(updateColumnCount);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [onColumnCountChange]);

  return (
    <>
      <div ref={gridRef} className={css.grid}>
        {items.map((item) => {
          const src = images.find((image) => image.id === item.id)?.src;
          const unavailable = !item.active;
          const lines = basketByProduct.get(item.id) ?? [];
          const quantity = lines.reduce((sum, line) => sum + (line.count ?? 1), 0);
          return (
            <article key={item.id} className={`${css.card} ${unavailable ? css.cardDisabled : ''}`}>
              <button type="button" className={css.imgWrap} onClick={() => onOpen(item)} disabled={unavailable} aria-label={quantity ? `${item.title}. ${t('dashboard.quantityInBasket', { count: quantity })}` : item.title}>
                {src ? <SkeletonImage src={src} alt={item.title} className={css.img} fallback={<span className={css.imgFallback} />} /> : <span className={css.imgFallback} />}
                {unavailable && <span className={css.unavailBadge}>{t('dashboard.outOfStock')}</span>}
                {lines.length > 1 && (
                  <span className={css.variantSummary} aria-label={t('dashboard.variantsInBasket')}>
                    {lines.map((line) => (
                      <span key={line.basketItemId ?? line.id} className={css.variantRow}>
                        <span className={css.variantName}>
                          {line.sauces.length ? line.sauces.map((sauce) => sauce.name).join(', ') : t('dashboard.noSauce')}
                        </span>
                        <strong>×{line.count ?? 1}</strong>
                      </span>
                    ))}
                  </span>
                )}
              </button>
              <div className={css.cardBody}>
                <button type="button" className={css.cardTitleButton} onClick={() => onOpen(item)} disabled={unavailable}>
                  <h3 className={css.cardTitle}>{item.title}</h3>
                </button>
                <p className={css.cardDesc}>{item.description}</p>
                <div className={css.cardFoot}>
                  <span className={css.price}>{formatAmount(item.price)} ֏</span>
                  {quantity > 0 ? (
                    <span className={css.cardQuantity}>
                      <button type="button" disabled={unavailable} onClick={() => onDecrease(lines)} aria-label={lines.length > 1 ? t('dashboard.chooseVariant') : t('order.decrease')}><TbMinus /></button>
                      <span aria-live="polite">{quantity}</span>
                      <button type="button" disabled={unavailable} onClick={() => void onQuickAdd(item)} aria-label={t('order.increase')}><PlusIcon /></button>
                    </span>
                  ) : (
                    <button type="button" className={css.addBtn} disabled={unavailable} onClick={() => void onQuickAdd(item)} aria-label={unavailable ? t('dashboard.outOfStock') : t('dashboard.add')}>
                      {unavailable ? t('dashboard.outOfStock') : <PlusIcon />}
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
          <button type="button" className={css.loadMore} onClick={onLoadMore}><TbChevronDown /> {t('dashboard.loadMore')}</button>
        </div>
      )}
    </>
  );
}
