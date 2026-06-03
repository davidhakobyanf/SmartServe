'use client';

import { useEffect, useState } from 'react';
import { Button, Input, InputNumber, Modal, Select, Form, Upload } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useFetching } from '@/hoc/fetchingHook';
import clientAPI from '@/api/api';
import { fileToImagePayload } from '@/lib/fileToImagePayload';
import { resolveMenuImageSrc } from '@/lib/menuImages';
import type { MenuCard } from '@/types';

interface EditCardModalProps {
  item: MenuCard | null;
  fetchProfile: () => void;
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
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const [editCard, editCardLoading] = useFetching(async (card: Partial<MenuCard>) => {
    try {
      await clientAPI.editCard(card);
    } catch (err) {
      console.error('Error editing card:', err);
    }
  });

  useEffect(() => {
    setShowEditConfirmation(false);
    setCardModalOpen(false);
    fetchProfile();
  }, [editCardLoading]);

  useEffect(() => {
    if (!item) return;
    form.setFieldsValue({
      title: item.title,
      description: item.description,
      price: item.price,
      sauces: item.sauces,
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
      title="Edit MenuCard"
      open={showEditConfirmation}
      onCancel={() => {
        form.resetFields();
        setShowEditConfirmation(false);
      }}
      width={350}
      footer={null}
    >
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input placeholder="Title" />
        </Form.Item>
        <Form.Item name="sauces" label="Sauces">
          <Select mode="tags" style={{ width: '100%' }} placeholder="Tags Mode" />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[{ required: true }]}>
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item name="image" label="Image">
          <Upload
            fileList={fileList}
            onChange={({ fileList: fl }) => setFileList(fl)}
            beforeUpload={() => false}
            maxCount={1}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />}>Select Image</Button>
          </Upload>
        </Form.Item>
        <Form.Item name="price" label="Price" rules={[{ required: true }]}>
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder="Price"
            addonAfter="դրամ"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Պահպանել
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
