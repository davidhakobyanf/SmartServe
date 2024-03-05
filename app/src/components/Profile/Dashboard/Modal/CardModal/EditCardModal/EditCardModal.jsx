import React, {useEffect, useState} from 'react';
import { Button, Input, Modal, Select, Form, Upload } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { UploadOutlined } from "@ant-design/icons";
import {useFetching} from "../../../../../../hoc/fetchingHook";
import clientAPI from "../../../../../../api/api"
const EditCardModal = ({ item, fetchProfile,setShowEditConfirmation, showEditConfirmation,setCardModalOpen }) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([
    ]);
    const [editCard,editCardLoading,editCardError] = useFetching(async (card) => {
        try {
            const {data:res} = await clientAPI.editCard(card) || {};
        }catch (err){
            console.error('Error fetching profile:', err);

        }
    })
    useEffect(() => {
        setShowEditConfirmation(false)
        setCardModalOpen(false)
        fetchProfile()
    }, [editCardLoading]);
    useEffect(() => {
        if (item) {
            form.setFieldsValue(item); // Установить новые начальные значения формы на основе item
            setFileList([item?.image]);
        }
    }, [item, form]);

    const onChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };
    const getBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    // Функция для предварительного просмотра изображения
    const onPreview = async (file) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        // Реализация предварительного просмотра
    };


    // Функция для обработки нажатия на кнопку сохранения
    const onFinish = (values) => {
        const image = fileList.length > 0 ? fileList[0] : null;

        // Обновляем объект значений с изображением
        const updatedValues = { ...values, image, active: true,id:item?.id};
        editCard(updatedValues)
        // Выводим обновленные значения в консоль
        console.log(updatedValues,'updatedValues');

        // Отправляем обновленные значения

        // Закрываем модальное окно
        // setShowEditConfirmation(false);
    };

    const handleCancel = () => {
        form.resetFields(); // Reset form fields
        setShowEditConfirmation(false);
    };
    return (
        <div>
            <Modal
                title="Create MenuCard"
                open={showEditConfirmation}
                onOk={onFinish}
                onCancel={handleCancel}
                width={350}
                footer={null}
            >
                <Form form={form} onFinish={onFinish} layout="vertical" initialValues={item}>
                    <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please input title!' }]}>
                        <Input type="text" placeholder="Title" />
                    </Form.Item>
                    <Form.Item name="sauces" label="Sauces">
                        <Select mode="tags" style={{ width: '100%' }} placeholder="Tags Mode" />
                    </Form.Item>
                    <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Please input Description!' }]}>
                        <TextArea rows={4} />
                    </Form.Item>
                    <Form.Item name="image" label="Image">
                        <Upload fileList={fileList} onChange={onChange} beforeUpload={() => false}>
                            <Button icon={<UploadOutlined />}>Select Image</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Please input price!' }]}>
                        <Input type="text" placeholder="Price" addonAfter="դրամ" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Պահպանել
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default EditCardModal;
