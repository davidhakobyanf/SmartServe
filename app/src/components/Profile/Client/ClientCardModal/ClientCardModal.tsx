'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { App, Modal } from 'antd';
import { TbX, TbMinus, TbPlus, TbCheck, TbStar, TbFlame } from 'react-icons/tb';
import css from './ClientCardModal.module.css';
import { useFetching } from '@/hoc/fetchingHook';
import clientAPI from '@/api/api';
import type { MenuCard, MenuImage } from '@/types';
import { formatAmount } from '@/lib/formatters';

interface ClientCardModalProps {
  setCardModalOpen: (open: boolean) => void;
  cardModalOpen: boolean;
  index: number | null;
  item: MenuCard | null;
  images: MenuImage[];
  badge?: 'popular' | 'chef' | null;
  editItem?: MenuCard | null;
}

export default function ClientCardModal({
  setCardModalOpen,
  cardModalOpen,
  index,
  item,
  images,
  badge = null,
  editItem = null,
}: ClientCardModalProps) {
  const t = useTranslations('client');
  const { message } = App.useApp();
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const [fetchAddCard] = useFetching(
    async (modifiedItem: MenuCard) => {
      if (editItem?.basketItemId) {
        await clientAPI.updateBasketItem(editItem.basketItemId, {
          quantity,
          sauceIds: modifiedItem.sauces.map((sauce) => sauce.id),
        });
      } else {
        await clientAPI.addBasketItem({
          productId: modifiedItem.id,
          quantity,
          sauceIds: modifiedItem.sauces.map((sauce) => sauce.id),
        });
      }
    },
  );

  // Pre-fill from the edited cart line, or reset for a fresh add.
  useEffect(() => {
    if (!cardModalOpen) return;
    if (editItem) {
      setQuantity(editItem.count ?? 1);
      const preset: Record<string, boolean> = {};
      (editItem.sauces ?? []).forEach((s) => {
        preset[s.id] = true;
      });
      setSelected(preset);
    } else {
      setQuantity(1);
      setSelected({});
    }
  }, [cardModalOpen, item?.id, editItem]);

  useEffect(() => {
    if (cardModalOpen && (!item || !item.active)) {
      setCardModalOpen(false);
    }
  }, [cardModalOpen, item, setCardModalOpen]);

  const imageSrc =
    index !== null
      ? images[index]?.src
      : item
        ? images.find((i) => i.id === item.id)?.src
        : undefined;

  const selectedSauces = (item?.sauces ?? []).filter(
    (sauce) => selected[sauce.id],
  );
  const total =
    ((item?.price ?? 0) +
      selectedSauces.reduce((sum, sauce) => sum + sauce.price, 0)) *
    quantity;

  const toggleSauce = (sauceId: string) =>
    setSelected((prev) => ({ ...prev, [sauceId]: !prev[sauceId] }));

  const handleAdd = async () => {
    if (!item?.active) return;
    const modifiedItem: MenuCard = {
      ...item,
      sauces: selectedSauces,
      count: quantity,
    };
    const succeeded = await fetchAddCard(modifiedItem);
    if (!succeeded) {
      message.error(t('card.serverError'));
      return;
    }
    if (editItem) message.success(t('card.updated'));
    else message.success(t('card.added'));
    setCardModalOpen(false);
  };

  return (
    <Modal
      open={cardModalOpen}
      onCancel={() => setCardModalOpen(false)}
      footer={null}
      closable={false}
      centered
      width={860}
      zIndex={1100}
      className={css.modal}
      styles={{ body: { padding: 0 } }}
    >
      {item ? (
        <div className={css.sheet}>
          <button
            type="button"
            className={css.close}
            onClick={() => setCardModalOpen(false)}
            aria-label={t('card.close')}
          >
            <TbX />
          </button>

          <div className={css.top}>
            <div className={css.hero}>
              {imageSrc ? (
                <img src={imageSrc} alt={item.title} className={css.heroImg} />
              ) : (
                <div className={css.heroFallback} />
              )}
            </div>

            <div className={css.info}>
              <h2 className={css.title}>{item.title}</h2>

              {badge === 'popular' && (
                <span className={`${css.badge} ${css.badgePopular}`}>
                  <TbFlame /> {t('card.badgePopular')}
                </span>
              )}
              {badge === 'chef' && (
                <span className={`${css.badge} ${css.badgeChef}`}>
                  <TbStar /> {t('card.badgeChef')}
                </span>
              )}

              {item.description && (
                <p className={css.desc}>{item.description}</p>
              )}

              <div className={css.unitPrice}>{formatAmount(item.price)} ֏</div>

              <div className={css.stepper}>
                <button
                  type="button"
                  className={css.stepBtn}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <TbMinus />
                </button>
                <span className={css.qtyBox}>{quantity}</span>
                <button
                  type="button"
                  className={css.stepBtn}
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <TbPlus />
                </button>
              </div>
            </div>
          </div>

          {item.sauces?.length > 0 && (
            <div className={css.extras}>
              <div className={css.extrasHead}>
                <span className={css.extrasTitle}>{t('card.addExtras')}</span>
                <span className={css.extrasOptional}>{t('card.optional')}</span>
              </div>
              <div className={css.sauceList}>
                {item.sauces.map((sauce) => {
                  const on = !!selected[sauce.id];
                  return (
                    <button
                      key={sauce.id}
                      type="button"
                      className={css.sauceRow}
                      onClick={() => toggleSauce(sauce.id)}
                    >
                      <span
                        className={`${css.check} ${on ? css.checkOn : ''}`}
                      >
                        {on && <TbCheck />}
                      </span>
                      <span className={css.sauceName}>{sauce.name}</span>
                      <span className={css.saucePrice}>
                        {formatAmount(sauce.price)} ֏
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={css.footer}>
            <div className={css.totalBox}>
              <img
                src="/images/leftIcon.png"
                alt=""
                className={css.basketIcon}
              />
              <div className={css.totalText}>
                <span className={css.totalLabel}>{t('card.totalAmount')}</span>
                <span className={css.totalValue}>{formatAmount(total)} ֏</span>
              </div>
            </div>
            <button
              type="button"
              className={css.addBtn}
              onClick={() => void handleAdd()}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {editItem ? t('card.update') : t('card.addToOrder')}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
