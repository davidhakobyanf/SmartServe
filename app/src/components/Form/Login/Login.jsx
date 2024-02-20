import React from 'react';
import css from "./Login.module.css";
import {Button, Form, Input, message} from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import {Link, useNavigate} from "react-router-dom";

const Login = ({ form, handleCreate, check, setCheck }) => {
    const navigate = useNavigate()
    const success = () => {
        message.success('Login was successful');
    };
    const error = () => {
        message.error('Login attempt was unsuccessful.');
    };
    const handleLogin = async (values) => {
        try {
            const response = await fetch('http://localhost:8000/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();
            console.log(data,'data')
            if (response.ok) {
                console.log('Login successful');
                localStorage.setItem('isLoggedIn', true);
                navigate('/profile/dashboard')
                success()
            } else {
                console.log('Login failed:', data.error);
                error()
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };
    const switchToRegistration = () => {
        form.resetFields();
        setCheck(true)
    }
    return (
        <div className={css.right}>
            <h2 className={css.title}>Login</h2>
            <Form form={form} onFinish={handleLogin} className={css.form}>
                <Form.Item
                    name="email"
                    rules={[
                        { required: true, message: 'Please enter your email' },
                        { type: 'email', message: 'Please enter a valid email' },
                    ]}
                >
                    <Input placeholder="Email" />
                </Form.Item>
                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please enter your password' }]}
                >
                    <Input.Password
                        placeholder="Enter your password"
                        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                </Form.Item>
                <Button type="primary" htmlType="submit">
                    Login
                </Button>
            </Form>
            <div className={css.network}>
                <div className={css.networkTwitter}></div>
                <div className={css.networkFacebook}></div>
                <div className={css.networkGithub}></div>
                <div className={css.networkLinkedin}></div>
            </div>
            <div className={css.login_link}>
                <p>If you don't have an account, click on</p> <Link onClick={switchToRegistration}>Registration</Link>
            </div>
        </div>
    );
};

export default Login;
