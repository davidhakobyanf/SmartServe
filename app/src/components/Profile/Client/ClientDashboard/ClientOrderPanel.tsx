import { useTranslations } from 'next-intl';
import { TbArrowRight, TbLock, TbMinus, TbPlus, TbShoppingCart, TbTrash, TbX } from 'react-icons/tb';
import type { MenuCard, MenuImage } from '@/types';
import { formatAmount } from '@/lib/formatters';
import { getBasketLineKey, getMenuLineTotal } from '@/lib/clientMenu';
import css from './ClientDashboard.module.css';

interface ClientOrderPanelProps {
  open: boolean;
  basket: MenuCard[];
  images: MenuImage[];
  total: number;
  onClose: () => void;
  onOpenItem: (item: MenuCard) => void;
  onChangeCount: (item: MenuCard, next: number) => Promise<void>;
  onRemove: (item: MenuCard) => Promise<void>;
  onPlaceOrder: () => Promise<boolean>;
}

export default function ClientOrderPanel({ open, basket, images, total, onClose, onOpenItem, onChangeCount, onRemove, onPlaceOrder }: ClientOrderPanelProps) {
  const t = useTranslations('client');
  return (
    <>
      <aside className={`${css.order} ${open ? css.orderOpen : ''}`} aria-label={t('order.title')}>
        <div className={css.orderHead}>
          <h3>{t('order.title')}</h3>
          <button type="button" className={css.orderClose} onClick={onClose} aria-label={t('card.close')}><TbX /></button>
        </div>
        <div className={`${css.orderList} ss-scroll`}>
          {basket.length === 0 ? (
            <div className={css.orderEmpty}><TbShoppingCart /><p>{t('order.empty')}</p></div>
          ) : basket.map((item) => {
            const src = images.find((image) => image.id === item.id)?.src;
            return (
              <div key={getBasketLineKey(item)} className={css.orderItem}>
                <button type="button" className={css.orderThumbButton} onClick={() => onOpenItem(item)} aria-label={item.title}>
                  {src ? <img src={src} alt="" className={css.orderThumb} /> : <span className={css.orderThumbFallback} />}
                </button>
                <div className={css.orderItemInfo}>
                  <div className={css.orderItemTop}>
                    <button type="button" className={css.orderItemNameButton} onClick={() => onOpenItem(item)}>{item.title}</button>
                    <button type="button" className={css.removeBtn} onClick={() => void onRemove(item)} aria-label={t('order.removeItem', { name: item.title })}><TbTrash /></button>
                  </div>
                  <span className={css.orderItemPrice}>{formatAmount(getMenuLineTotal(item))} ֏</span>
                  <div className={css.stepper}>
                    <button type="button" onClick={() => void onChangeCount(item, (item.count ?? 1) - 1)} aria-label={t('order.decrease')}><TbMinus /></button>
                    <span>{item.count ?? 1}</span>
                    <button type="button" onClick={() => void onChangeCount(item, (item.count ?? 1) + 1)} aria-label={t('order.increase')}><TbPlus /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className={css.orderFooter}>
          <div className={css.totalRow}><span>{t('order.total')}</span><span className={css.totalValue}>{formatAmount(total)} ֏</span></div>
          <button type="button" className={css.placeBtn} disabled={basket.length === 0} onClick={() => void onPlaceOrder()}>
            <TbLock className={css.placeLock} />{t('order.placeOrder')}<TbArrowRight className={css.placeArrow} />
          </button>
          <p className={css.kitchenNote}><TbLock /> {t('order.kitchenNote')}</p>
        </div>
      </aside>
      {open && <button type="button" className={css.backdrop} onClick={onClose} aria-label={t('card.close')} />}
    </>
  );
}
