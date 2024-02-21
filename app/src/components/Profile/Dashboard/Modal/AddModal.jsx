import React, { useState } from 'react';
import { Button, Input, Modal, Select, Form, Upload, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { PlusOutlined } from '@ant-design/icons';

const AddModal = ({ modalOpen,setModalOpen }) => {
    const [form] = Form.useForm();
    const [imageUrl, setImageUrl] = useState(null);

    const handleOk = () => {
        form.submit();
    };

    const handleCancel = () => {
        setModalOpen(false)
        // Handle cancel action
    };

    const onFinish = (values) => {
        // Handle form submission
        console.log('Form values:', values);
        // You can submit the form data to your server here
    };

    const options = [];
    for (let i = 10; i < 36; i++) {
        options.push({
            value: i.toString(36) + i,
            label: i.toString(36) + i,
        });
    }

    const handleChange = (value) => {
        console.log(`Selected ${value}`);
    };

    const getBase64 = (img, callback) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => callback(reader.result));
        reader.readAsDataURL(img);
    };

    const beforeUpload = (file) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error('You can only upload JPG/PNG file!');
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
            message.error('Image must be smaller than 2MB!');
        }
        return isJpgOrPng && isLt2M ? file : false;
    };

    const normFile = async (e) => {
        console.log('Upload event:', e);
        if (Array.isArray(e)) {
            return e;
        }
        const file = e.file;
        const isImage = beforeUpload(file);
        if (isImage) {
            getBase64(file, (imageUrl) => {
                setImageUrl(imageUrl);
            });
        }
        return isImage ? [{ ...file, imageUrl: imageUrl }] : null;
    };

    return (
        <div>
            <Modal
                title="Create MenuCard"
                open={modalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                width={350}
                footer={null}
            >
                <Form form={form} onFinish={onFinish} layout="vertical">
                    <Form.Item
                        name="Title"
                        label="Title"
                        rules={[{ required: true, message: 'Please input title!' }]}
                    >
                        <Input type="text" placeholder="Title" />
                    </Form.Item>
                    <Form.Item
                        name="Sauces"
                        label="Sauces"
                        rules={[{ required: true, message: 'Please input Sauces!' }]}
                    >
                        <Select
                            mode="tags"
                            style={{
                                width: '100%',
                            }}
                            placeholder="Tags Mode"
                            onChange={handleChange}
                            options={options}
                        />
                    </Form.Item>
                    <Form.Item
                        name="Description"
                        label="Description"
                        rules={[{ required: true, message: 'Please input Description!' }]}
                    >
                        <TextArea rows={4} />
                    </Form.Item>
                    <Form.Item label="Upload" valuePropName="fileList" getValueFromEvent={normFile}>
                        <Upload beforeUpload={beforeUpload} listType="picture-card">
                            {imageUrl ? (
                                <img src={imageUrl} alt="avatar" style={{ width: '100%' }} />
                            ) : (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Create
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AddModal;
