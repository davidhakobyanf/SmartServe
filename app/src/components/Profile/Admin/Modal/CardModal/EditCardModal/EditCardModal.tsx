'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, InputNumber, Modal, Select, Form, Upload } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useFetching } from '@/hoc/fetchingHook';
import clientAPI from '@/api/api';
import { fileToImagePayload } from '@/lib/fileToImagePayload';
import { resolveMenuImageSrc } from '@/lib/menuImages';
import type { MenuCard } from '@/types';
import type { CategoryRecord, SauceRecord } from '@/types/restaurant';

interface EditCardModalProps {
  item: MenuCard | null;
  fetchProfile: (options?: { force?: boolean }) => void;
  setShowEditConfirmation: (v: boolean) => void;
  showEditConfirmation: boolean;
  setCardModalOpen: (v: boolean) => void;
}

export default function EditCardModal({
  item,
  fetchProfile,
  setShowEditConfirmation,
  showEditConfirmation,
  setCardModalOpen,
}: EditCardModalProps) {
  const t = useTranslations('menuModal');
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [sauces, setSauces] = useState<SauceRecord[]>([]);

  useEffect(() => {
    void Promise.all([clientAPI.getCategories(), clientAPI.getSauces()]).then(
      ([categoriesResponse, saucesResponse]) => {
        setCategories(categoriesResponse.data ?? []);
        setSauces(saucesResponse.data ?? []);
      },
    );
  }, []);

  const [editCard] = useFetching(async (card: Partial<MenuCard>) => {
    try {
      if (!card.id) return;
      await clientAPI.updateProduct(card.id, {
        categoryId: card.categoryId,
        title: card.title,
        description: card.description,
        price: card.price,
        sauceIds:
          card.sauceIds ?? (card.sauces ?? []).map((sauce) => sauce.id),
        isActive: card.active,
        image: card.image,
      });
      await fetchProfile({ force: true });
      setShowEditConfirmation(false);
      setCardModalOpen(false);
    } catch (err) {
      console.error('Error editing card:', err);
    }
  });

  useEffect(() => {
    if (!item) return;
    form.setFieldsValue({
      title: item.title,
      description: item.description,
      price: item.price,
      sauceIds: item.sauces.map((sauce) => sauce.id),
      categoryId: item.categoryId,
    });
    setFileList([
      {
        uid: item.id,
        name: item.image?.name ?? 'image',
        status: 'done',
        url: resolveMenuImageSrc(item),
      },
    ]);
  }, [item, form]);

  const onFinish = async (values: Record<string, unknown>) => {
    if (!item) return;
    const uploadFile = fileList[0]?.originFileObj as File | undefined;
    const image = uploadFile
      ? await fileToImagePayload(uploadFile)
      : {
          name: item.image?.name ?? 'image.jpg',
          mimeType: item.image?.mimeType,
          hasData: item.image?.hasData,
        };
    const updatedValues = {
      ...values,
      price: Number(values.price),
      image,
      active: item.active,
      id: item.id,
    };
    void editCard(updatedValues as Partial<MenuCard>);
  };

  return (
    <Modal
      title={t('edit.title')}
      open={showEditConfirmation}
      onCancel={() => {
        form.resetFields();
        setShowEditConfirmation(false);
      }}
      width={350}
      footer={null}
      forceRender
    >
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item name="categoryId" label="Категория" rules={[{ required: true }]}>
          <Select
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
        </Form.Item>
        <Form.Item name="title" label={t('fields.title')} rules={[{ required: true }]}>
          <Input placeholder={t('fields.titlePlaceholder')} />
        </Form.Item>
        <Form.Item name="sauceIds" label={t('fields.sauces')}>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder={t('fields.tagsPlaceholder')}
            options={sauces.map((sauce) => ({
              value: sauce.id,
              label: `${sauce.name} — ${Number(sauce.price)} ֏${
                sauce.isActive ? '' : ` (${t('fields.inactive')})`
              }`,
            }))}
          />
        </Form.Item>
        <Form.Item name="description" label={t('fields.description')} rules={[{ required: true }]}>
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item name="image" label={t('fields.image')}>
          <Upload
            fileList={fileList}
            onChange={({ fileList: fl }) => setFileList(fl)}
            beforeUpload={() => false}
            maxCount={1}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />}>{t('fields.selectImage')}</Button>
          </Upload>
        </Form.Item>
        <Form.Item name="price" label={t('fields.price')} rules={[{ required: true }]}>
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder={t('fields.pricePlaceholder')}
            suffix={t('dram')}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {t('edit.submit')}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
