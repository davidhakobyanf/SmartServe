import React, { useState } from 'react';
import { Button, Input, Modal, Select, Form, Upload, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import ImgCrop from 'antd-img-crop';
import img from '../../../../images/Screenshot 2024-02-20 231709.png'
import {UploadOutlined} from "@ant-design/icons";
import {useFetching} from "../../../../hoc/fetchingHook";
import clientAPI from "../../../../api/api";

const AddModal = ({ modalOpen,setModalOpen }) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const [fetchAddCard, AddCardLoading, AddCardError] = useFetching(async (formData) => {
        try {
            const { data: res } = await clientAPI.createCard(formData);
            if (res) {
                console.log(res, 'res');
                const updatedCardArray = res.card ? [...res.card, formData] : [formData];
                const updatedRes = { ...res, card: updatedCardArray };
                // Use the updatedRes object as needed (e.g., store in state or update UI)
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    });
    const onChange = ({ fileList: newFileList }) => {
        console.log(newFileList,'newFileList')
        setFileList(newFileList);
    };
    const onPreview = async (file) => {
        console.log(file,'file')
        let src = file.url;
        if (!src) {
            src = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file.originFileObj);
                reader.onload = () => resolve(reader.result);
            });
        }
        const image = new Image();
        image.src = src;
        const imgWindow = window.open(src);
        imgWindow?.document.write(image.outerHTML);
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
        const updatedValues = { ...values, image };
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
                        name="description"
                        label="Description"
                        rules={[{ required: true, message: 'Please input Description!' }]}
                    >
                        <TextArea rows={4} />
                    </Form.Item>
                    <Form.Item  name='image' getValueFromEvent={getFile}>
                        <ImgCrop rotationSlider>
                            <Upload fileList={fileList} onChange={onChange} onPreview={onPreview}>
                                <Button icon={<UploadOutlined />}>Click to Upload</Button>
                            </Upload>
                        </ImgCrop>
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
