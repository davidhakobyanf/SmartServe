import React, {useState} from 'react';
import { Input, Button, Form as AntdForm } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import css from './FormContainer.module.css';
import {Link} from "react-router-dom";
import Registration from "./Registration/Registration";
import Login from "./Login/Login";

const FormContainer = () => {
    const [form] = AntdForm .useForm();
    const [check,setCheck] = useState()
    const handleCreate = () => {
        form
            .validateFields()
            .then((values) => {
                console.log('Form values:', values);
                // You can perform further actions with the form data here
            })
            .catch((error) => {
                console.error('Validation failed:', error);
            });
    };

    return (
        <div className={css.container}>
            <div className={css.block}>
                <div className={css.left}></div>
                {check ? (
                    <Registration form={form} handleCreate={handleCreate} check={check} setCheck={setCheck} />
                ) : (
                    <Login form={form} handleCreate={handleCreate} check={check} setCheck={setCheck} />
                )}
            </div>
        </div>
    );
};

export default FormContainer;
