'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { App, Button, InputNumber, Modal, Select, Form, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useFetching } from '@/hoc/fetchingHook';
import clientAPI from '@/api/api';
import { fileToImagePayload } from '@/lib/fileToImagePayload';
import { resolveMenuImageSrc } from '@/lib/menuImages';
import type { MenuCard } from '@/types';
import type { CategoryRecord, SauceRecord } from '@/types/restaurant';
import LocalizedTextFields from '@/components/Common/LocalizedTextFields';
import {
  cleanLocalizedText,
  hasLocalizedText,
  missingContentLocales,
  type LocalizedText,
} from '@/types/localization';

interface EditCardModalProps {
  item: MenuCard | null;
  fetchProfile: (options?: { force?: boolean }) => void;
  setShowEditConfirmation: (v: boolean) => void;
  showEditConfirmation: boolean;
  setCardModalOpen: (v: boolean) => void;
}

interface ProductFormValues {
  categoryId: string;
  titleTranslations?: LocalizedText;
  descriptionTranslations?: LocalizedText;
  sauceIds?: string[];
  price: number;
  image?: unknown;
}

export default function EditCardModal({
  item,
  fetchProfile,
  setShowEditConfirmation,
  showEditConfirmation,
  setCardModalOpen,
}: EditCardModalProps) {
  const t = useTranslations('menuModal');
  const commonT = useTranslations('common');
  const { message } = App.useApp();
  const [form] = Form.useForm<ProductFormValues>();
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
        titleTranslations: card.titleTranslations,
        descriptionTranslations: card.descriptionTranslations,
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
      titleTranslations: hasLocalizedText(item.titleTranslations)
        ? item.titleTranslations
        : { en: item.title },
      descriptionTranslations: hasLocalizedText(item.descriptionTranslations)
        ? item.descriptionTranslations
        : { en: item.description },
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

  const onFinish = async (values: ProductFormValues) => {
    if (!item) return;
    if (
      !hasLocalizedText(values.titleTranslations) ||
      !hasLocalizedText(values.descriptionTranslations)
    ) {
      message.error(commonT('translationRequired'));
      return;
    }
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
      titleTranslations: cleanLocalizedText(values.titleTranslations),
      descriptionTranslations: cleanLocalizedText(
        values.descriptionTranslations,
      ),
      price: Number(values.price),
      image,
      active: item.active,
      id: item.id,
    };
    void editCard(updatedValues as Partial<MenuCard>);
    const missing = new Set([
      ...missingContentLocales(values.titleTranslations),
      ...missingContentLocales(values.descriptionTranslations),
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
  };

  return (
    <Modal
      title={t('edit.title')}
      open={showEditConfirmation}
      onCancel={() => {
        form.resetFields();
        setShowEditConfirmation(false);
      }}
      width={520}
      footer={null}
      forceRender
    >
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item name="categoryId" label={t('fields.category')} rules={[{ required: true, message: t('validation.category') }]}> 
          <Select
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
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
              label: `${sauce.name} — ${Number(sauce.price)} ֏${
                sauce.isActive ? '' : ` (${t('fields.inactive')})`
              }`,
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
