import React, { useState } from 'react';
import { Button, Input, Modal, Select, Form, Upload, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import ImgCrop from 'antd-img-crop';
import img from '../../../../images/Screenshot 2024-02-20 231709.png'
import {UploadOutlined} from "@ant-design/icons";
import {useFetching} from "../../../../hoc/fetchingHook";
import clientAPI from "../../../../api/api";

const AddModal = ({ modalOpen,setModalOpen,fetchAddCard}) => {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);

    const onChange = ({ fileList: newFileList }) => {
        console.log(newFileList,'newFileList')
        setFileList(newFileList);
    };
    const getBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    const onPreview = async (file) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
        setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
    };
    const handleOk = () => {
        form.submit();
    };

    const handleCancel = () => {
        setModalOpen(false)
        // Handle cancel action
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
    const onFinish = (values) => {
        // Extract the image information from the fileList
        const image = fileList.length > 0 ? fileList[0] : null;

        // Update the values object with the image
        const updatedValues = { ...values, image, active: true };
        fetchAddCard(updatedValues)
        setModalOpen(false)
        console.log(updatedValues);
        // Handle form submission with updated values
    };

    const getFile = (e) => {
        console.log('Upload event:', e);

        if (Array.isArray(e)) {
            return e;
        }
        return e && e.fileList;
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
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: 'Please input title!' }]}
                    >
                        <Input type="text" placeholder="Title" />
                    </Form.Item>
                    <Form.Item
                        name="sauces"
                        label="Sauces"
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
                        name="description"
                        label="Description"
                        rules={[{ required: true, message: 'Please input Description!' }]}
                    >
                        <TextArea rows={4} />
                    </Form.Item>
                    <Form.Item name="image" label="Image">
                            <Upload
                                fileList={fileList}
                                onChange={onChange}
                                beforeUpload={() => false} // Returning false to prevent default upload behavior
                            >
                                <Button icon={<UploadOutlined />}>Select Image</Button>
                            </Upload>
                    </Form.Item>

                    <Form.Item
                        name="price"
                        label="Price"
                        rules={[{ required: true, message: 'Please input price!' }]}
                    >
                        <Input  type="text"  placeholder="Price"  addonAfter="դրամ" />

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
