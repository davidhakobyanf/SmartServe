'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  App,
  Button,
  InputNumber,
  Modal,
  Select,
  Form,
  Switch,
  Upload,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useFetching } from '@/hoc/fetchingHook';
import clientAPI from '@/api/api';
import { fileToImagePayload } from '@/lib/fileToImagePayload';
import { IMAGE_ACCEPT, validateImageFile } from '@/lib/imageValidation';
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
import formCss from '../../ProductForm.module.css';

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
  stockQuantity: number;
  isActive: boolean;
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
    if (!card.id) return;
    await clientAPI.updateProduct(card.id, {
      categoryId: card.categoryId,
      titleTranslations: card.titleTranslations,
      descriptionTranslations: card.descriptionTranslations,
      price: card.price,
      stockQuantity: card.stockQuantity,
      sauceIds:
        card.sauceIds ?? (card.sauces ?? []).map((sauce) => sauce.id),
      isActive: card.active,
      image: card.image,
    });
    await fetchProfile({ force: true });
    setShowEditConfirmation(false);
    setCardModalOpen(false);
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
      stockQuantity: item.stockQuantity ?? 0,
      isActive: item.active,
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
  }, [item, form, showEditConfirmation]);

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
      stockQuantity: Number(values.stockQuantity),
      image,
      active: values.isActive,
      id: item.id,
    };
    const succeeded = await editCard(updatedValues as Partial<MenuCard>);
    if (!succeeded) {
      message.error(t('edit.error'));
      return;
    }
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

  const beforeImageUpload = (file: File) => {
    const validationError = validateImageFile(file);
    if (!validationError) return false;

    message.error(t(`validation.${validationError}`));
    return Upload.LIST_IGNORE;
  };

  return (
    <Modal
      title={t('edit.title')}
      open={showEditConfirmation}
      onCancel={() => {
        form.resetFields();
        setShowEditConfirmation(false);
      }}
      width={900}
      footer={null}
      forceRender
      centered
      className={formCss.modal}
    >
      <Form form={form} onFinish={onFinish} layout="vertical">
        <div className={formCss.formGrid}>
          <div className={formCss.mainColumn}>
            <section className={formCss.section}>
              <h3 className={formCss.sectionTitle}>{t('sections.content')}</h3>
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
                />
              </Form.Item>
              <LocalizedTextFields
                name="titleTranslations"
                label={t('fields.title')}
                placeholder={t('fields.titlePlaceholder')}
                maxLength={160}
                required
              />
              <LocalizedTextFields
                name="descriptionTranslations"
                label={t('fields.description')}
                placeholder={t('fields.descriptionPlaceholder')}
                maxLength={2000}
                multiline
                rows={3}
                required
              />
              <Form.Item name="sauceIds" label={t('fields.sauces')}>
                <Select
                  mode="multiple"
                  placeholder={t('fields.tagsPlaceholder')}
                  options={sauces.map((sauce) => ({
                    value: sauce.id,
                    label: `${sauce.name} — ${Number(sauce.price)} ֏${
                      sauce.isActive ? '' : ` (${t('fields.inactive')})`
                    }`,
                  }))}
                />
              </Form.Item>
            </section>
          </div>

          <aside className={formCss.sideColumn}>
            <section className={formCss.section}>
              <h3 className={formCss.sectionTitle}>{t('fields.image')}</h3>
              <Form.Item name="image">
                <Upload
                  className={formCss.imageUpload}
                  listType="picture-card"
                  fileList={fileList}
                  onChange={({ fileList: fl }) => setFileList(fl)}
                  beforeUpload={beforeImageUpload}
                  maxCount={1}
                  accept={IMAGE_ACCEPT}
                >
                  {fileList.length === 0 ? (
                    <div className={formCss.uploadPrompt}>
                      <UploadOutlined />
                      <span>{t('fields.selectImage')}</span>
                    </div>
                  ) : null}
                </Upload>
              </Form.Item>
            </section>

            <section className={formCss.section}>
              <h3 className={formCss.sectionTitle}>{t('sections.sales')}</h3>
              <div className={formCss.twoColumns}>
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
                <Form.Item
                  name="stockQuantity"
                  label={t('fields.stockQuantity')}
                  rules={[{ required: true, message: t('validation.stockQuantity') }]}
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    style={{ width: '100%' }}
                    placeholder={t('fields.stockPlaceholder')}
                  />
                </Form.Item>
              </div>
              <div className={formCss.availabilityRow}>
                <div className={formCss.availabilityText}>
                  <strong>{t('fields.availability')}</strong>
                  <span>{t('fields.availabilityHint')}</span>
                </div>
                <Form.Item name="isActive" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
              </div>
            </section>

            <div className={formCss.actions}>
              <Button onClick={() => setShowEditConfirmation(false)}>
                {t('actions.cancel')}
              </Button>
              <Button type="primary" htmlType="submit">
                {t('edit.submit')}
              </Button>
            </div>
          </aside>
        </div>
      </Form>
    </Modal>
  );
}
