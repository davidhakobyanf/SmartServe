'use client';

import { App, Modal } from 'antd';
import { useTranslations } from 'next-intl';
import clientAPI from '@/api/api';
import { useFetching } from '@/hoc/fetchingHook';
import type { MenuCard } from '@/types';
import { getApiErrorStatus } from '@/lib/apiError';

interface DeleteCardModalProps {
  title: string;
  isVisible: boolean;
  onCancel: () => void;
  okText: string;
  cancelText: string;
  fetchProfile: (options?: { force?: boolean }) => void;
  setShowDeleteConfirmation: (v: boolean) => void;
  card: MenuCard | null;
  setCardModalOpen: (v: boolean) => void;
}

export default function DeleteCardModal({
  title,
  isVisible,
  onCancel,
  okText,
  cancelText,
  fetchProfile,
  setShowDeleteConfirmation,
  card,
  setCardModalOpen,
}: DeleteCardModalProps) {
  const { message } = App.useApp();
  const t = useTranslations('menuModal.card');
  const [deleteCard, deleting] = useFetching(async (id: string) => {
    try {
      await clientAPI.deleteProduct(id);
      await fetchProfile({ force: true });
      setShowDeleteConfirmation(false);
      setCardModalOpen(false);
      message.success(t('deleteSuccess'));
    } catch (error) {
      if (getApiErrorStatus(error) === 409) {
        message.error(t('deleteBlocked'));
      } else {
        message.error(t('deleteError'));
      }
    }
  });

  const onOk = () => {
    if (card) {
      void deleteCard(card.id);
    }
  };

  return (
    <Modal
      title={title}
      open={isVisible}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={deleting}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ danger: true }}
    />
  );
}
