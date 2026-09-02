'use client';

import { useCallback, useEffect, useState } from 'react';
import { App, Button, Input, InputNumber, List, Modal, Space, Switch } from 'antd';
import clientAPI from '@/api/api';
import type { CategoryRecord } from '@/types/restaurant';

interface Props {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export default function CategoryManagementModal({ open, onClose, onChanged }: Props) {
  const { message } = App.useApp();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
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
    setName('');
    setSortOrder(0);
    setEditing(null);
  };

  const save = async () => {
    if (!name.trim()) return;
    try {
      setLoading(true);
      if (editing) {
        await clientAPI.updateCategory(editing.id, {
          name: name.trim(),
          sortOrder,
        });
      } else {
        await clientAPI.createCategory({ name: name.trim(), sortOrder });
      }
      resetForm();
      await load();
      onChanged();
    } catch {
      message.error('Не удалось сохранить категорию');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (category: CategoryRecord) => {
    setEditing(category);
    setName(category.name);
    setSortOrder(category.sortOrder);
  };

  const toggle = async (category: CategoryRecord, isActive: boolean) => {
    try {
      await clientAPI.updateCategory(category.id, { isActive });
      await load();
      onChanged();
    } catch {
      message.error('Не удалось изменить категорию');
    }
  };

  return (
    <Modal title="Категории" open={open} onCancel={onClose} footer={null}>
      <Space.Compact style={{ width: '100%', marginBottom: 20 }}>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Название категории"
          onPressEnter={() => void save()}
        />
        <InputNumber
          min={0}
          value={sortOrder}
          onChange={(value) => setSortOrder(value ?? 0)}
          aria-label="Порядок"
        />
        <Button type="primary" loading={loading} onClick={() => void save()}>
          {editing ? 'Сохранить' : 'Добавить'}
        </Button>
      </Space.Compact>
      {editing && (
        <Button type="link" onClick={resetForm} style={{ marginBottom: 12 }}>
          Отменить редактирование
        </Button>
      )}
      <List
        dataSource={categories}
        locale={{ emptyText: 'Категорий пока нет' }}
        renderItem={(category) => (
          <List.Item
            actions={[
              <Button
                key="edit"
                type="link"
                onClick={() => startEditing(category)}
              >
                Изменить
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
              description={`Порядок: ${category.sortOrder}`}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}
