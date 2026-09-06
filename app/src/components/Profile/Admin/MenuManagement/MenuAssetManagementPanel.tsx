'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Form,
  Image,
  InputNumber,
  Upload,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useTranslations } from 'next-intl';
import clientAPI from '@/api/api';
import { fileToDataUrl, fileToImagePayload } from '@/lib/fileToImagePayload';
import LocalizedTextFields from '@/components/Common/LocalizedTextFields';
import {
  cleanLocalizedText,
  hasLocalizedText,
  missingContentLocales,
  type LocalizedText,
} from '@/types/localization';
import css from './AssetManagementModal.module.css';
import { IMAGE_ACCEPT, validateImageFile } from '@/lib/imageValidation';
import { getApiErrorStatus } from '@/lib/apiError';
import MenuAssetList from './MenuAssetList';
import {
  getMenuAssetImageUrl,
  getMenuAssetValue,
  type MenuAssetKind,
  type MenuAssetRecord,
} from './menuAsset';

interface MenuAssetManagementPanelProps {
  kind: MenuAssetKind;
  onChanged: () => void;
}

interface AssetFormValues {
  nameTranslations?: LocalizedText;
  numericValue: number;
}

export default function MenuAssetManagementPanel({
  kind,
  onChanged,
}: MenuAssetManagementPanelProps) {
  const isCategory = kind === 'category';
  const t = useTranslations(
    isCategory ? 'menu.categoriesManagement' : 'menu.sauces',
  );
  const commonT = useTranslations('common');
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<AssetFormValues>();
  const [assets, setAssets] = useState<MenuAssetRecord[]>([]);
  const [editing, setEditing] = useState<MenuAssetRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const formSectionRef = useRef<HTMLElement>(null);

  const loadAssets = useCallback(async () => {
    try {
      const { data } = isCategory
        ? await clientAPI.getCategories()
        : await clientAPI.getSauces();
      setAssets(data ?? []);
    } catch {
      message.error(t('loadError'));
    }
  }, [isCategory, message, t]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const resetForm = () => {
    form.resetFields();
    form.setFieldValue('numericValue', 0);
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

  const saveAsset = async () => {
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
      const imageChanges = {
        ...(image ? { image } : {}),
        ...(removeImage ? { removeImage: true } : {}),
      };

      if (isCategory) {
        const payload = {
          nameTranslations,
          sortOrder: values.numericValue,
          ...imageChanges,
        };
        if (editing) await clientAPI.updateCategory(editing.id, payload);
        else await clientAPI.createCategory(payload);
      } else {
        const payload = {
          nameTranslations,
          price: values.numericValue,
          ...imageChanges,
        };
        if (editing) await clientAPI.updateSauce(editing.id, payload);
        else await clientAPI.createSauce(payload);
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
      await loadAssets();
      onChanged();
    } catch {
      message.error(t('saveError'));
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (asset: MenuAssetRecord) => {
    setEditing(asset);
    form.setFieldsValue({
      nameTranslations: asset.nameTranslations,
      numericValue: getMenuAssetValue(kind, asset),
    });
    setFileList(
      asset.imageName
        ? [
            {
              uid: `${kind}-${asset.id}`,
              name: asset.imageName,
              status: 'done',
              url: getMenuAssetImageUrl(kind, asset),
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

  const toggleAsset = async (asset: MenuAssetRecord, isActive: boolean) => {
    try {
      if (isCategory) await clientAPI.updateCategory(asset.id, { isActive });
      else await clientAPI.updateSauce(asset.id, { isActive });
      await loadAssets();
      onChanged();
    } catch {
      message.error(t('toggleError'));
    }
  };

  const removeAsset = (asset: MenuAssetRecord) => {
    modal.confirm({
      title: t('deleteConfirm', { name: asset.name }),
      okText: commonT('delete'),
      cancelText: commonT('cancel'),
      okType: 'danger',
      onOk: async () => {
        try {
          if (isCategory) await clientAPI.deleteCategory(asset.id);
          else await clientAPI.deleteSauce(asset.id);
          if (editing?.id === asset.id) resetForm();
          await loadAssets();
          onChanged();
          message.success(t('deleteSuccess'));
        } catch (error) {
          if (
            isCategory &&
            getApiErrorStatus(error) === 409
          ) {
            message.error(t('deleteBlocked'));
          } else {
            message.error(t('deleteError'));
          }
        }
      },
    });
  };

  const numericLabel = t(isCategory ? 'sortOrder' : 'priceLabel');

  return (
    <div className={css.assetWorkspace}>
      <section ref={formSectionRef} className={css.editorCard}>
        <h2 className={css.panelHeading}>
          {editing ? t('editFormTitle') : t('formTitle')}
        </h2>
        {editing && (
          <Alert
            type="info"
            showIcon
            message={t('editingBanner', { name: editing.name })}
            description={
              <div className={css.editingAlertBody}>
                <span>{t('editingHint')}</span>
                <Button size="small" onClick={resetForm}>
                  {t('cancelEdit')}
                </Button>
              </div>
            }
            className={css.editingAlert}
          />
        )}
        <Form
          form={form}
          layout="vertical"
          initialValues={{ numericValue: 0 }}
        >
          <LocalizedTextFields
            name="nameTranslations"
            label={t(isCategory ? 'name' : 'nameLabel')}
            placeholder={t('namePlaceholder')}
            maxLength={100}
            required
          />
          <Form.Item
            name="numericValue"
            label={numericLabel}
            rules={
              isCategory
                ? undefined
                : [{ required: true, message: t('priceRequired') }]
            }
          >
            <InputNumber
              min={0}
              precision={isCategory ? 0 : 2}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label={t('imageLabel')} extra={t('imageHint')}>
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: nextFiles }) => setFileList(nextFiles)}
              beforeUpload={(file) => {
                const validationError = validateImageFile(file);
                if (validationError === 'invalidType') {
                  message.error(t('imageInvalid'));
                  return Upload.LIST_IGNORE;
                }
                if (validationError === 'tooLarge') {
                  message.error(t('imageTooLarge'));
                  return Upload.LIST_IGNORE;
                }
                return false;
              }}
              maxCount={1}
              accept={IMAGE_ACCEPT}
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
          <Button
            type="primary"
            loading={loading}
            onClick={() => void saveAsset()}
          >
            {editing ? t('save') : t('add')}
          </Button>
        </Form>
      </section>

      <MenuAssetList
        kind={kind}
        assets={assets}
        editingId={editing?.id}
        onEdit={startEditing}
        onDelete={removeAsset}
        onToggle={toggleAsset}
      />
    </div>
  );
}
