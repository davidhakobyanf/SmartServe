'use client';

import css from './Registration.module.css';
import { Button, Form, Input, message } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { API_URL } from '@/lib/apiUrl';
import type { RegisterFormValues } from '@/types';

interface RegistrationProps {
  form: FormInstance;
  setCheck: (value: boolean) => void;
}

export default function Registration({ form, setCheck }: RegistrationProps) {
  const success = () => message.success('Registration was successful.');
  const showError = () => message.error('Email is already registered.');

  const handleCreate = async (values: RegisterFormValues) => {
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        showError();
        return;
      }

      const data = await response.json();
      form.resetFields();
      setCheck(false);
      success();
      console.log(data);
    } catch (err) {
      console.error('Error:', err);
      showError();
    }
  };

  const switchToLogin = () => {
    form.resetFields();
    setCheck(false);
  };

  return (
    <div className={css.right}>
      <h2 className={css.title}>Registration</h2>
      <Form form={form} onFinish={handleCreate} className={css.form}>
        <Form.Item
          name="name"
          rules={[{ required: true, message: 'Please enter your name' }]}
        >
          <Input placeholder="Name" />
        </Form.Item>
        <Form.Item
          name="surname"
          rules={[{ required: true, message: 'Please enter your surname' }]}
        >
          <Input placeholder="Surname" />
        </Form.Item>
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
          rules={[
            { required: true, message: 'Please enter your password' },
            { min: 6, message: 'Password must be at least 6 characters long' },
            {
              pattern:
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]+$/,
              message:
                'Password must contain uppercase, lowercase, number, and special character',
            },
          ]}
        >
          <Input.Password
            placeholder="Enter your password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please re-enter your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password
            placeholder="Re-enter your password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Create
        </Button>
      </Form>
      <div className={css.network}>
        <div className={css.networkTwitter} />
        <div className={css.networkFacebook} />
        <div className={css.networkGithub} />
        <div className={css.networkLinkedin} />
      </div>
      <div className={css.registartion_link}>
        <p>If you already have an account, click on</p>
        <button type="button" className={css.linkButton} onClick={switchToLogin}>
          Login
        </button>
      </div>
    </div>
  );
}
