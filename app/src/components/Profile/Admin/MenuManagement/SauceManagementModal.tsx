'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Button, Input, InputNumber, List, Modal, Space, Switch } from 'antd';
import { useTranslations } from 'next-intl';
import clientAPI from '@/api/api';
import type { SauceRecord } from '@/types/restaurant';

interface Props {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export default function SauceManagementModal({ open, onClose, onChanged }: Props) {
  const { message } = App.useApp();
  const t = useTranslations('menu.sauces');
  const [sauces, setSauces] = useState<SauceRecord[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [editing, setEditing] = useState<SauceRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await clientAPI.getSauces();
      setSauces(data ?? []);
    } catch {
      message.error(t('loadError'));
    }
  }, [message, t]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const resetForm = () => {
    setName('');
    setPrice(0);
    setEditing(null);
  };

  const save = async () => {
    if (!name.trim()) return;
    try {
      setLoading(true);
      if (editing) {
        await clientAPI.updateSauce(editing.id, { name: name.trim(), price });
      } else {
        await clientAPI.createSauce({ name: name.trim(), price });
      }
      resetForm();
      await load();
      onChanged();
    } catch {
      message.error(t('saveError'));
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (sauce: SauceRecord) => {
    setEditing(sauce);
    setName(sauce.name);
    setPrice(Number(sauce.price));
  };

  const toggle = async (sauce: SauceRecord, isActive: boolean) => {
    try {
      await clientAPI.updateSauce(sauce.id, { isActive });
      await load();
      onChanged();
    } catch {
      message.error(t('toggleError'));
    }
  };

  return (
    <Modal
      title={t('title')}
      open={open}
      onCancel={onClose}
      afterClose={resetForm}
      footer={null}
    >
      <Space.Compact style={{ width: '100%', marginBottom: 20 }}>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('namePlaceholder')}
          onPressEnter={() => void save()}
        />
        <InputNumber
          min={0}
          precision={2}
          value={price}
          onChange={(value) => setPrice(Number(value) || 0)}
          aria-label={t('priceLabel')}
        />
        <Button type="primary" loading={loading} onClick={() => void save()}>
          {editing ? t('save') : t('add')}
        </Button>
      </Space.Compact>
      {editing && (
        <Button type="link" onClick={resetForm} style={{ marginBottom: 12 }}>
          {t('cancelEdit')}
        </Button>
      )}
      <List
        dataSource={sauces}
        locale={{ emptyText: t('empty') }}
        renderItem={(sauce) => (
          <List.Item
            actions={[
              <Button key="edit" type="link" onClick={() => startEditing(sauce)}>
                {t('edit')}
              </Button>,
              <Switch
                key="active"
                checked={sauce.isActive}
                onChange={(checked) => void toggle(sauce, checked)}
              />,
            ]}
          >
            <List.Item.Meta
              title={sauce.name}
              description={`${Number(sauce.price)} ֏`}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}
