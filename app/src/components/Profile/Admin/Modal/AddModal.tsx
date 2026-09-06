'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { App, Button, InputNumber, Modal, Select, Form, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { fileToImagePayload } from '@/lib/fileToImagePayload';
import { IMAGE_ACCEPT, validateImageFile } from '@/lib/imageValidation';
import type { MenuCard } from '@/types';
import type { CategoryRecord, SauceRecord } from '@/types/restaurant';
import clientAPI from '@/api/api';
import LocalizedTextFields from '@/components/Common/LocalizedTextFields';
import {
  cleanLocalizedText,
  hasLocalizedText,
  missingContentLocales,
  type LocalizedText,
} from '@/types/localization';

interface AddModalProps {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  fetchAddCard: (values: Partial<MenuCard>) => void;
}

interface ProductFormValues {
  categoryId: string;
  titleTranslations?: LocalizedText;
  descriptionTranslations?: LocalizedText;
  sauceIds?: string[];
  price: number;
  image?: unknown;
}

export default function AddModal({
  modalOpen,
  setModalOpen,
  fetchAddCard,
}: AddModalProps) {
  const t = useTranslations('menuModal');
  const commonT = useTranslations('common');
  const { message } = App.useApp();
  const [form] = Form.useForm<ProductFormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [sauces, setSauces] = useState<SauceRecord[]>([]);

  useEffect(() => {
    if (modalOpen) {
      void Promise.all([clientAPI.getCategories(), clientAPI.getSauces()]).then(
        ([categoriesResponse, saucesResponse]) => {
          setCategories(
            (categoriesResponse.data ?? []).filter((category) => category.isActive),
          );
          setSauces(
            (saucesResponse.data ?? []).filter((sauce) => sauce.isActive),
          );
        },
      );
    }
  }, [modalOpen]);

  const onChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
  };

  const beforeImageUpload = (file: File) => {
    const validationError = validateImageFile(file);
    if (!validationError) return false;

    message.error(t(`validation.${validationError}`));
    return Upload.LIST_IGNORE;
  };

  const onFinish = async (values: ProductFormValues) => {
    if (
      !hasLocalizedText(values.titleTranslations) ||
      !hasLocalizedText(values.descriptionTranslations)
    ) {
      message.error(commonT('translationRequired'));
      return;
    }
    const uploadFile = fileList[0]?.originFileObj as File | undefined;
    if (!uploadFile) {
      form.setFields([{ name: 'image', errors: [t('validation.image')] }]);
      return;
    }
    const image = await fileToImagePayload(uploadFile);
    const titleTranslations = cleanLocalizedText(values.titleTranslations);
    const descriptionTranslations = cleanLocalizedText(
      values.descriptionTranslations,
    );
    const updatedValues = {
      ...values,
      titleTranslations,
      descriptionTranslations,
      price: Number(values.price),
      image,
      active: true,
    };
    fetchAddCard(updatedValues as Partial<MenuCard>);
    const missing = new Set([
      ...missingContentLocales(titleTranslations),
      ...missingContentLocales(descriptionTranslations),
    ]);
    if (missing.size > 0) {
      message.warning(
        commonT('missingTranslations', {
          languages: [...missing]
            .map((locale) => commonT(`lang_${locale}`))
            .join(', '),
        }),
      );
    }
    setModalOpen(false);
    form.resetFields();
    setFileList([]);
  };

  return (
    <Modal
      title={t('add.title')}
      open={modalOpen}
      onOk={() => form.submit()}
      onCancel={() => setModalOpen(false)}
      width={520}
      footer={null}
      forceRender
    >
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          name="categoryId"
          label={t('fields.category')}
          rules={[{ required: true, message: t('validation.category') }]}
        >
          <Select
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            placeholder={t('fields.categoryPlaceholder')}
          />
        </Form.Item>
        <LocalizedTextFields
          name="titleTranslations"
          label={t('fields.title')}
          placeholder={t('fields.titlePlaceholder')}
          maxLength={160}
          required
        />
        <Form.Item name="sauceIds" label={t('fields.sauces')}>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder={t('fields.tagsPlaceholder')}
            options={sauces.map((sauce) => ({
              value: sauce.id,
              label: `${sauce.name} — ${Number(sauce.price)} ֏`,
            }))}
          />
        </Form.Item>
        <LocalizedTextFields
          name="descriptionTranslations"
          label={t('fields.description')}
          placeholder={t('fields.descriptionPlaceholder')}
          maxLength={2000}
          multiline
          required
        />
        <Form.Item
          name="image"
          label={t('fields.image')}
          rules={[{ required: true, message: t('validation.image') }]}
        >
          <Upload
            fileList={fileList}
            onChange={onChange}
            beforeUpload={beforeImageUpload}
            maxCount={1}
            accept={IMAGE_ACCEPT}
          >
            <Button icon={<UploadOutlined />}>{t('fields.selectImage')}</Button>
          </Upload>
        </Form.Item>
        <Form.Item
          name="price"
          label={t('fields.price')}
          rules={[{ required: true, message: t('validation.price') }]}
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder={t('fields.pricePlaceholder')}
            suffix={t('dram')}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {t('add.submit')}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
