'use client';

import { Modal, Tabs } from 'antd';
import { useTranslations } from 'next-intl';
import CategoryManagementPanel from './CategoryManagementModal';
import SauceManagementPanel from './SauceManagementModal';

export type MenuAssetsTab = 'categories' | 'sauces';

interface Props {
  open: boolean;
  activeTab: MenuAssetsTab;
  canManageCategories: boolean;
  canManageSauces: boolean;
  onTabChange: (tab: MenuAssetsTab) => void;
  onClose: () => void;
  onCategoriesChanged: () => void;
  onSaucesChanged: () => void;
}

export default function MenuAssetsManagementModal({
  open,
  activeTab,
  canManageCategories,
  canManageSauces,
  onTabChange,
  onClose,
  onCategoriesChanged,
  onSaucesChanged,
}: Props) {
  const t = useTranslations('menu');

  const items = [
    ...(canManageCategories
      ? [
          {
            key: 'categories',
            label: t('categoriesButton'),
            children: (
              <CategoryManagementPanel onChanged={onCategoriesChanged} />
            ),
          },
        ]
      : []),
    ...(canManageSauces
      ? [
          {
            key: 'sauces',
            label: t('saucesButton'),
            children: <SauceManagementPanel onChanged={onSaucesChanged} />,
          },
        ]
      : []),
  ];

  return (
    <Modal
      title={t('assetsManagementTitle')}
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnHidden
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => onTabChange(key as MenuAssetsTab)}
        destroyOnHidden={false}
        items={items}
      />
    </Modal>
  );
}
