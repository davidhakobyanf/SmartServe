import { useTranslations } from 'next-intl';
import { Avatar, Button, List, Switch } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import type { CategoryRecord, SauceRecord } from '@/types/restaurant';
import { getMenuAssetImageUrl, type MenuAssetKind, type MenuAssetRecord } from './menuAsset';
import css from './AssetManagementModal.module.css';

interface MenuAssetListProps {
  kind: MenuAssetKind;
  assets: MenuAssetRecord[];
  editingId?: string;
  onEdit: (asset: MenuAssetRecord) => void;
  onDelete: (asset: MenuAssetRecord) => void;
  onToggle: (asset: MenuAssetRecord, active: boolean) => Promise<void>;
}

export default function MenuAssetList({ kind, assets, editingId, onEdit, onDelete, onToggle }: MenuAssetListProps) {
  const isCategory = kind === 'category';
  const t = useTranslations(isCategory ? 'menu.categoriesManagement' : 'menu.sauces');
  const commonT = useTranslations('common');

  return (
    <section className={css.listCard}>
      <h2 className={css.panelHeading}>{t('listTitle')}</h2>
      <List
        dataSource={assets}
        locale={{ emptyText: t('empty') }}
        renderItem={(asset) => (
          <List.Item actions={[
            <Button key="edit" type="link" disabled={editingId === asset.id} onClick={() => onEdit(asset)}>
              {editingId === asset.id ? t('editingNow') : t('edit')}
            </Button>,
            <Button key="delete" type="link" danger onClick={() => onDelete(asset)}>{commonT('delete')}</Button>,
            <Switch key="active" checked={asset.isActive} onChange={(checked) => void onToggle(asset, checked)} />,
          ]}>
            <List.Item.Meta
              avatar={<Avatar shape="square" size={48} src={getMenuAssetImageUrl(kind, asset)} icon={<PictureOutlined />} />}
              title={asset.name}
              description={isCategory
                ? t('sortOrderValue', { value: (asset as CategoryRecord).sortOrder })
                : `${Number((asset as SauceRecord).price)} ֏`}
            />
          </List.Item>
        )}
      />
    </section>
  );
}
