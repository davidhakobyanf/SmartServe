'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Modal, Switch, Tag } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import DeleteCardModal from './DeleteCardModal/DeleteCardModal';
import EditCardModal from './EditCardModal/EditCardModal';
import { formatAmount } from '@/lib/formatters';
import type { MenuCard, MenuImage } from '@/types';
import css from './CardModal.module.css';

interface CardModalProps {
  setCardModalOpen: (open: boolean) => void;
  cardModalOpen: boolean;
  item: MenuCard | null;
  images: MenuImage[];
  fetchProfile: (options?: { force?: boolean }) => void;
  onToggleActive: (item: MenuCard) => Promise<void>;
}

export default function CardModal({
  setCardModalOpen,
  cardModalOpen,
  item,
  images,
  fetchProfile,
  onToggleActive,
}: CardModalProps) {
  const t = useTranslations('menuModal');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [switching, setSwitching] = useState(false);
  const imageSrc = item
    ? images.find((image) => image.id === item.id)?.src
    : undefined;

  const handleAvailabilityChange = async () => {
    if (!item) return;
    setSwitching(true);
    try {
      await onToggleActive(item);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <>
      <Modal
        title={t('card.detailsTitle')}
        open={cardModalOpen}
        onCancel={() => setCardModalOpen(false)}
        width={820}
        footer={null}
        centered
        className={css.modal}
      >
        {item ? (
          <div className={css.container}>
            <div className={css.hero}>
              <div className={css.imagePanel}>
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={item.title}
                    className={css.cardImage}
                  />
                ) : (
                  <div className={css.imageFallback}>{t('card.noImage')}</div>
                )}
              </div>

              <div className={css.details}>
                <div className={css.headingRow}>
                  <div>
                    {item.categoryName && (
                      <div className={css.category}>{item.categoryName}</div>
                    )}
                    <h2 className={css.cardTitle}>{item.title}</h2>
                  </div>
                  <div className={css.availability}>
                    <span>{t('card.availability')}</span>
                    <Switch
                      checked={item.active}
                      loading={switching}
                      onChange={() => void handleAvailabilityChange()}
                    />
                    <strong className={item.active ? css.active : css.inactive}>
                      {item.active ? t('card.available') : t('card.unavailable')}
                    </strong>
                  </div>
                </div>

                <p className={css.description}>{item.description}</p>

                <div className={css.stats}>
                  <div className={css.stat}>
                    <span>{t('card.unitPrice')}</span>
                    <strong>{formatAmount(item.price)} ֏</strong>
                  </div>
                  <div className={css.stat}>
                    <span>{t('card.stockQuantity')}</span>
                    <strong>{item.stockQuantity ?? t('card.stockNotSet')}</strong>
                  </div>
                </div>
              </div>
            </div>

            <section className={css.saucesSection}>
              <h3>{t('card.sauces')}</h3>
              <div className={css.sauces}>
                {item.sauces.length > 0 ? (
                  item.sauces.map((sauce) => (
                    <Tag key={sauce.id} className={css.sauceTag}>
                      {sauce.name} · {formatAmount(sauce.price)} ֏
                    </Tag>
                  ))
                ) : (
                  <span className={css.emptyText}>{t('card.noSauces')}</span>
                )}
              </div>
            </section>

            <div className={css.actions}>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => setShowDeleteConfirmation(true)}
              >
                {t('card.delete')}
              </Button>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setShowEditConfirmation(true)}
              >
                {t('card.edit')}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <EditCardModal
        item={item}
        fetchProfile={fetchProfile}
        showEditConfirmation={showEditConfirmation}
        setShowEditConfirmation={setShowEditConfirmation}
        setCardModalOpen={setCardModalOpen}
      />
      <DeleteCardModal
        fetchProfile={fetchProfile}
        title={t('card.deleteConfirm', { title: item?.title ?? '' })}
        isVisible={showDeleteConfirmation}
        onCancel={() => setShowDeleteConfirmation(false)}
        setShowDeleteConfirmation={setShowDeleteConfirmation}
        okText={t('card.deleteOk')}
        cancelText={t('card.deleteCancel')}
        card={item}
        setCardModalOpen={setCardModalOpen}
      />
    </>
  );
}
