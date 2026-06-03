'use client';

import { useState } from 'react';
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
      form.setFields([{ name: 'image', errors: ['Ընտրեք նկար'] }]);
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
      title="Create MenuCard"
      open={modalOpen}
      onOk={() => form.submit()}
      onCancel={() => setModalOpen(false)}
      width={350}
      footer={null}
    >
      <Form form={form} onFinish={onFinish} layout="vertical">
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please input title!' }]}
        >
          <Input placeholder="Title" />
        </Form.Item>
        <Form.Item name="sauces" label="Sauces">
          <Select mode="tags" style={{ width: '100%' }} placeholder="Tags Mode" options={options} />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please input Description!' }]}
        >
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item
          name="image"
          label="Image"
          rules={[{ required: true, message: 'Ընտրեք նկար' }]}
        >
          <Upload
            fileList={fileList}
            onChange={onChange}
            beforeUpload={() => false}
            maxCount={1}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />}>Select Image</Button>
          </Upload>
        </Form.Item>
        <Form.Item
          name="price"
          label="Price"
          rules={[{ required: true, message: 'Please input price!' }]}
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder="Price"
            addonAfter="դրամ"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Create
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
