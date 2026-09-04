'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Button, Form, InputNumber, List, Modal, Switch } from 'antd';
import { useTranslations } from 'next-intl';
import clientAPI from '@/api/api';
import type { CategoryRecord } from '@/types/restaurant';
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

interface CategoryFormValues {
  nameTranslations?: LocalizedText;
  sortOrder: number;
}

export default function CategoryManagementModal({ open, onClose, onChanged }: Props) {
  const { message } = App.useApp();
  const t = useTranslations('menu.categoriesManagement');
  const commonT = useTranslations('common');
  const [form] = Form.useForm<CategoryFormValues>();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [editing, setEditing] = useState<CategoryRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const { data } = await clientAPI.getCategories();
    setCategories(data ?? []);
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const resetForm = () => {
    form.resetFields();
    form.setFieldValue('sortOrder', 0);
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
        await clientAPI.updateCategory(editing.id, {
          nameTranslations,
          sortOrder: values.sortOrder,
        });
      } else {
        await clientAPI.createCategory({
          nameTranslations,
          sortOrder: values.sortOrder,
        });
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

  const startEditing = (category: CategoryRecord) => {
    setEditing(category);
    form.setFieldsValue({
      nameTranslations: category.nameTranslations,
      sortOrder: category.sortOrder,
    });
  };

  const toggle = async (category: CategoryRecord, isActive: boolean) => {
    try {
      await clientAPI.updateCategory(category.id, { isActive });
      await load();
      onChanged();
    } catch {
      message.error(t('toggleError'));
    }
  };

  return (
    <Modal title={t('title')} open={open} onCancel={onClose} footer={null}>
      <Form form={form} layout="vertical" initialValues={{ sortOrder: 0 }}>
        <LocalizedTextFields
          name="nameTranslations"
          label={t('name')}
          placeholder={t('namePlaceholder')}
          maxLength={100}
          required
        />
        <Form.Item name="sortOrder" label={t('sortOrder')}>
          <InputNumber min={0} style={{ width: '100%' }} />
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
        dataSource={categories}
        locale={{ emptyText: t('empty') }}
        renderItem={(category) => (
          <List.Item
            actions={[
              <Button
                key="edit"
                type="link"
                onClick={() => startEditing(category)}
              >
                {t('edit')}
              </Button>,
              <Switch
                key="active"
                checked={category.isActive}
                onChange={(checked) => void toggle(category, checked)}
              />,
            ]}
          >
            <List.Item.Meta
              title={category.name}
              description={t('sortOrderValue', { value: category.sortOrder })}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}
