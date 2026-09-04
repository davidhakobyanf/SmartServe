'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Button, Form, InputNumber, List, Modal, Switch } from 'antd';
import { useTranslations } from 'next-intl';
import clientAPI from '@/api/api';
import type { SauceRecord } from '@/types/restaurant';
import LocalizedTextFields from '@/components/Common/LocalizedTextFields';
import {
  cleanLocalizedText,
  hasLocalizedText,
  missingContentLocales,
  type LocalizedText,
} from '@/types/localization';

interface Props {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

interface SauceFormValues {
  nameTranslations?: LocalizedText;
  price: number;
}

export default function SauceManagementModal({ open, onClose, onChanged }: Props) {
  const { message } = App.useApp();
  const t = useTranslations('menu.sauces');
  const commonT = useTranslations('common');
  const [form] = Form.useForm<SauceFormValues>();
  const [sauces, setSauces] = useState<SauceRecord[]>([]);
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
    form.resetFields();
    form.setFieldValue('price', 0);
    setEditing(null);
  };

  const save = async () => {
    const values = await form.validateFields();
    if (!hasLocalizedText(values.nameTranslations)) {
      message.error(commonT('translationRequired'));
      return;
    }
    const nameTranslations = cleanLocalizedText(values.nameTranslations);
    try {
      setLoading(true);
      if (editing) {
        await clientAPI.updateSauce(editing.id, {
          nameTranslations,
          price: values.price,
        });
      } else {
        await clientAPI.createSauce({ nameTranslations, price: values.price });
      }
      const missing = missingContentLocales(nameTranslations);
      if (missing.length > 0) {
        message.warning(
          commonT('missingTranslations', {
            languages: missing
              .map((locale) => commonT(`lang_${locale}`))
              .join(', '),
          }),
        );
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
    form.setFieldsValue({
      nameTranslations: sauce.nameTranslations,
      price: Number(sauce.price),
    });
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
      <Form form={form} layout="vertical" initialValues={{ price: 0 }}>
        <LocalizedTextFields
          name="nameTranslations"
          label={t('nameLabel')}
          placeholder={t('namePlaceholder')}
          maxLength={100}
          required
        />
        <Form.Item
          name="price"
          label={t('priceLabel')}
          rules={[{ required: true, message: t('priceRequired') }]}
        >
          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
        </Form.Item>
        <Button type="primary" loading={loading} onClick={() => void save()}>
          {editing ? t('save') : t('add')}
        </Button>
      </Form>
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
