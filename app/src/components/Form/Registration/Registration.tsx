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

      await response.json();
      form.resetFields();
      setCheck(false);
      success();
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
    <div className={css.wrap}>
      <h2 className={css.title}>Create account</h2>
      <p className={css.subtitle}>Start managing your restaurant</p>

      <Form
        form={form}
        onFinish={handleCreate}
        layout="vertical"
        requiredMark={false}
        className={css.form}
      >
        <div className={css.grid}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input size="large" placeholder="Name" />
          </Form.Item>
          <Form.Item
            name="surname"
            label="Surname"
            rules={[{ required: true, message: 'Please enter your surname' }]}
          >
            <Input size="large" placeholder="Surname" />
          </Form.Item>
        </div>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input size="large" placeholder="Enter your email" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
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
            size="large"
            placeholder="Enter your password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Confirm password"
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
            size="large"
            placeholder="Re-enter your password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block>
          Create account
        </Button>
      </Form>

      <p className={css.switch}>
        Already have an account?{' '}
        <button type="button" className={css.link} onClick={switchToLogin}>
          Login
        </button>
      </p>
    </div>
  );
}
