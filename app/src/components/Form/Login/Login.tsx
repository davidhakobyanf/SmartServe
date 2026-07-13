'use client';

import css from './Login.module.css';
import { Button, Form, Input, Checkbox, message } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { FormInstance } from 'antd';
import { API_URL } from '@/lib/apiUrl';
import type { LoginFormValues } from '@/types';

interface LoginProps {
  form: FormInstance;
  handleCreate: () => void;
  check: boolean;
  setCheck: (value: boolean) => void;
}

export default function Login({ form, setCheck }: LoginProps) {
  const router = useRouter();

  const handleLogin = async (values: LoginFormValues) => {
    try {
      const response = await fetch(`${API_URL}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('isLoggedIn', 'true');
        message.success('Login was successful');
        router.push('/profile/menu');
      } else {
        console.log('Login failed:', data.error);
        message.error('Login attempt was unsuccessful.');
      }
    } catch (err) {
      console.error('Error:', err);
      message.error('Login attempt was unsuccessful.');
    }
  };

  const switchToRegistration = () => {
    form.resetFields();
    setCheck(true);
  };

  return (
    <div className={css.wrap}>
      <h2 className={css.title}>Welcome back!</h2>
      <p className={css.subtitle}>Sign in to your account</p>

      <Form
        form={form}
        onFinish={handleLogin}
        layout="vertical"
        requiredMark={false}
        className={css.form}
      >
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
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password
            size="large"
            placeholder="Enter your password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <div className={css.row}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>Remember me</Checkbox>
          </Form.Item>
          <button type="button" className={css.link}>
            Forgot password?
          </button>
        </div>

        <Button type="primary" htmlType="submit" size="large" block>
          Sign In
        </Button>
      </Form>

      <p className={css.switch}>
        Don&apos;t have an account?{' '}
        <button type="button" className={css.link} onClick={switchToRegistration}>
          Register
        </button>
      </p>
    </div>
  );
}
