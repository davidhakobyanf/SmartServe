'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, InputNumber, Modal, Select, Form, Upload } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { fileToImagePayload } from '@/lib/fileToImagePayload';
import type { MenuCard } from '@/types';

interface AddModalProps {
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  fetchAddCard: (values: Partial<MenuCard>) => void;
}

export default function AddModal({
  modalOpen,
  setModalOpen,
  fetchAddCard,
}: AddModalProps) {
  const t = useTranslations('menuModal');
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const onChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
  };

  const options = Array.from({ length: 26 }, (_, i) => {
    const n = i + 10;
    return { value: n.toString(36) + n, label: n.toString(36) + n };
  });

  const onFinish = async (values: Record<string, unknown>) => {
    const uploadFile = fileList[0]?.originFileObj as File | undefined;
    if (!uploadFile) {
      form.setFields([{ name: 'image', errors: [t('validation.image')] }]);
      return;
    }
    const image = await fileToImagePayload(uploadFile);
    const updatedValues = {
      ...values,
      price: Number(values.price),
      image,
      active: true,
    };
    fetchAddCard(updatedValues as Partial<MenuCard>);
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
      width={350}
      footer={null}
      forceRender
    >
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          name="title"
          label={t('fields.title')}
          rules={[{ required: true, message: t('validation.title') }]}
        >
          <Input placeholder={t('fields.titlePlaceholder')} />
        </Form.Item>
        <Form.Item name="sauces" label={t('fields.sauces')}>
          <Select mode="tags" style={{ width: '100%' }} placeholder={t('fields.tagsPlaceholder')} options={options} />
        </Form.Item>
        <Form.Item
          name="description"
          label={t('fields.description')}
          rules={[{ required: true, message: t('validation.description') }]}
        >
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item
          name="image"
          label={t('fields.image')}
          rules={[{ required: true, message: t('validation.image') }]}
        >
          <Upload
            fileList={fileList}
            onChange={onChange}
            beforeUpload={() => false}
            maxCount={1}
            accept="image/*"
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
            addonAfter={t('dram')}
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
