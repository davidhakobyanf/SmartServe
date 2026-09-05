'use client';

import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  App,
  Avatar,
  Button,
  Form,
  Image,
  InputNumber,
  List,
  Switch,
  Upload,
} from 'antd';
import { PictureOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useTranslations } from 'next-intl';
import clientAPI from '@/api/api';
import type { CategoryRecord } from '@/types/restaurant';
import { fileToDataUrl, fileToImagePayload } from '@/lib/fileToImagePayload';
import { categoryImageApiUrl } from '@/lib/entityImages';
import css from './AssetManagementModal.module.css';
import LocalizedTextFields from '@/components/Common/LocalizedTextFields';
import {
  cleanLocalizedText,
  hasLocalizedText,
  missingContentLocales,
  type LocalizedText,
} from '@/types/localization';

interface Props {
  onChanged: () => void;
}

interface CategoryFormValues {
  nameTranslations?: LocalizedText;
  sortOrder: number;
}

export default function CategoryManagementPanel({ onChanged }: Props) {
  const { message, modal } = App.useApp();
  const t = useTranslations('menu.categoriesManagement');
  const commonT = useTranslations('common');
  const [form] = Form.useForm<CategoryFormValues>();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [editing, setEditing] = useState<CategoryRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const formSectionRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await clientAPI.getCategories();
    setCategories(data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    form.resetFields();
    form.setFieldValue('sortOrder', 0);
    setEditing(null);
    setFileList([]);
    setPreviewOpen(false);
    setPreviewImage('');
  };

  const previewFile = async (file: UploadFile) => {
    let source = file.url ?? file.preview;
    if (!source && file.originFileObj) {
      source = await fileToDataUrl(file.originFileObj as File);
      file.preview = source;
    }
    if (source) {
      setPreviewImage(source);
      setPreviewOpen(true);
    }
  };

  const confirmImageRemoval = () =>
    new Promise<boolean>((resolve) => {
      modal.confirm({
        title: commonT('imageDeleteConfirm'),
        okText: commonT('delete'),
        cancelText: commonT('cancel'),
        okType: 'danger',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

  const save = async () => {
    const values = await form.validateFields();
    if (!hasLocalizedText(values.nameTranslations)) {
      message.error(commonT('translationRequired'));
      return;
    }
    const nameTranslations = cleanLocalizedText(values.nameTranslations);
    const wasEditing = Boolean(editing);
    try {
      setLoading(true);
      const uploadFile = fileList[0]?.originFileObj as File | undefined;
      const image = uploadFile
        ? await fileToImagePayload(uploadFile)
        : undefined;
      const removeImage = Boolean(editing?.imageName && fileList.length === 0);
      if (editing) {
        await clientAPI.updateCategory(editing.id, {
          nameTranslations,
          sortOrder: values.sortOrder,
          ...(image ? { image } : {}),
          ...(removeImage ? { removeImage: true } : {}),
        });
      } else {
        await clientAPI.createCategory({
          nameTranslations,
          sortOrder: values.sortOrder,
          ...(image ? { image } : {}),
        });
      }
      message.success(t(wasEditing ? 'updateSuccess' : 'createSuccess'));
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
    setFileList(
      category.imageName
        ? [
            {
              uid: `category-${category.id}`,
              name: category.imageName,
              status: 'done',
              url: categoryImageApiUrl(category.id, category.updatedAt),
            },
          ]
        : [],
    );
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
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

  const removeCategory = (category: CategoryRecord) => {
    modal.confirm({
      title: t('deleteConfirm', { name: category.name }),
      okText: commonT('delete'),
      cancelText: commonT('cancel'),
      okType: 'danger',
      onOk: async () => {
        try {
          await clientAPI.deleteCategory(category.id);
          if (editing?.id === category.id) resetForm();
          await load();
          onChanged();
          message.success(t('deleteSuccess'));
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 409) {
            message.error(t('deleteBlocked'));
          } else {
            message.error(t('deleteError'));
          }
        }
      },
    });
  };

  return (
    <>
      <div ref={formSectionRef}>
        {editing && (
          <Alert
            type="info"
            showIcon
            message={t('editingBanner', { name: editing.name })}
            description={t('editingHint')}
            action={
              <Button size="small" onClick={resetForm}>
                {t('cancelEdit')}
              </Button>
            }
            style={{ marginBottom: 16 }}
          />
        )}
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
        <Form.Item label={t('imageLabel')} extra={t('imageHint')}>
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={({ fileList: nextFiles }) => setFileList(nextFiles)}
            beforeUpload={(file) => {
              if (!file.type.startsWith('image/')) {
                message.error(t('imageInvalid'));
                return Upload.LIST_IGNORE;
              }
              if (file.size > 5 * 1024 * 1024) {
                message.error(t('imageTooLarge'));
                return Upload.LIST_IGNORE;
              }
              return false;
            }}
            maxCount={1}
            accept="image/*"
            onPreview={(file) => void previewFile(file)}
            onRemove={confirmImageRemoval}
            showUploadList={{ showPreviewIcon: true }}
          >
            {fileList.length === 0 && (
              <button type="button" className={css.uploadTrigger}>
                <UploadOutlined />
                <span>{t('selectImage')}</span>
              </button>
            )}
          </Upload>
          <Image
            alt={t('imageLabel')}
            src={previewImage}
            wrapperStyle={{ display: 'none' }}
            preview={{
              visible: previewOpen,
              onVisibleChange: setPreviewOpen,
            }}
          />
        </Form.Item>
        <Button type="primary" loading={loading} onClick={() => void save()}>
          {editing ? t('save') : t('add')}
        </Button>
        </Form>
      </div>
      <List
        dataSource={categories}
        locale={{ emptyText: t('empty') }}
        renderItem={(category) => (
          <List.Item
            actions={[
              <Button
                key="edit"
                type="link"
                disabled={editing?.id === category.id}
                onClick={() => startEditing(category)}
              >
                {editing?.id === category.id ? t('editingNow') : t('edit')}
              </Button>,
              <Button
                key="delete"
                type="link"
                danger
                onClick={() => removeCategory(category)}
              >
                {commonT('delete')}
              </Button>,
              <Switch
                key="active"
                checked={category.isActive}
                onChange={(checked) => void toggle(category, checked)}
              />,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  shape="square"
                  size={48}
                  src={
                    category.imageName
                      ? categoryImageApiUrl(category.id, category.updatedAt)
                      : undefined
                  }
                  icon={<PictureOutlined />}
                />
              }
              title={category.name}
              description={t('sortOrderValue', { value: category.sortOrder })}
            />
          </List.Item>
        )}
      />
    </>
  );
}
