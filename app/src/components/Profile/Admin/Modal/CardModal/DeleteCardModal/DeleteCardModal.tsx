'use client';

import { useEffect } from 'react';
import { Modal } from 'antd';
import clientAPI from '@/api/api';
import { useFetching } from '@/hoc/fetchingHook';
import type { MenuCard } from '@/types';

interface DeleteCardModalProps {
  title: string;
  isVisible: boolean;
  onCancel: () => void;
  okText: string;
  cancelText: string;
  fetchProfile: () => void;
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
  const [deleteCard, deleteCardLoading] = useFetching(async (id: string) => {
    try {
      await clientAPI.deleteCard(id);
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  });

  const onOk = () => {
    if (card) {
      void deleteCard(card.id);
      setShowDeleteConfirmation(false);
      setCardModalOpen(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [deleteCardLoading]);

  return (
    <Modal
      title={title}
      open={isVisible}
      onOk={onOk}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
    />
  );
}
