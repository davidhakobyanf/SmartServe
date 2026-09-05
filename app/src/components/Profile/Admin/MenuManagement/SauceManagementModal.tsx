'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  App,
  Avatar,
  Button,
  Form,
  InputNumber,
  List,
  Modal,
  Switch,
  Upload,
} from 'antd';
import { PictureOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useTranslations } from 'next-intl';
import clientAPI from '@/api/api';
import type { SauceRecord } from '@/types/restaurant';
import { fileToImagePayload } from '@/lib/fileToImagePayload';
import { sauceImageApiUrl } from '@/lib/entityImages';
import css from './AssetManagementModal.module.css';
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
  const [fileList, setFileList] = useState<UploadFile[]>([]);

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
    setFileList([]);
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
      const uploadFile = fileList[0]?.originFileObj as File | undefined;
      const image = uploadFile
        ? await fileToImagePayload(uploadFile)
        : undefined;
      const removeImage = Boolean(editing?.imageName && fileList.length === 0);
      if (editing) {
        await clientAPI.updateSauce(editing.id, {
          nameTranslations,
          price: values.price,
          ...(image ? { image } : {}),
          ...(removeImage ? { removeImage: true } : {}),
        });
      } else {
        await clientAPI.createSauce({
          nameTranslations,
          price: values.price,
          ...(image ? { image } : {}),
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

  const startEditing = (sauce: SauceRecord) => {
    setEditing(sauce);
    form.setFieldsValue({
      nameTranslations: sauce.nameTranslations,
      price: Number(sauce.price),
    });
    setFileList(
      sauce.imageName
        ? [
            {
              uid: `sauce-${sauce.id}`,
              name: sauce.imageName,
              status: 'done',
              url: sauceImageApiUrl(sauce.id, sauce.updatedAt),
            },
          ]
        : [],
    );
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
            showUploadList={{ showPreviewIcon: false }}
          >
            {fileList.length === 0 && (
              <button type="button" className={css.uploadTrigger}>
                <UploadOutlined />
                <span>{t('selectImage')}</span>
              </button>
            )}
          </Upload>
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
              avatar={
                <Avatar
                  shape="square"
                  size={48}
                  src={
                    sauce.imageName
                      ? sauceImageApiUrl(sauce.id, sauce.updatedAt)
                      : undefined
                  }
                  icon={<PictureOutlined />}
                />
              }
              title={sauce.name}
              description={`${Number(sauce.price)} ֏`}
            />
          </List.Item>
        )}
      />
    </Modal>
  );
}
