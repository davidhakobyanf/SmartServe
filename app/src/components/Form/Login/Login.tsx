'use client';

import css from './Login.module.css';
import { Button, Form, Input, message } from 'antd';
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

  const success = () => message.success('Login was successful');
  const showError = () => message.error('Login attempt was unsuccessful.');

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
        router.push('/profile/dashboard');
        success();
      } else {
        console.log('Login failed:', data.error);
        showError();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const switchToRegistration = () => {
    form.resetFields();
    setCheck(true);
  };

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
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Login
        </Button>
      </Form>
      <div className={css.network}>
        <div className={css.networkTwitter} />
        <div className={css.networkFacebook} />
        <div className={css.networkGithub} />
        <div className={css.networkLinkedin} />
      </div>
      <div className={css.login_link}>
        <p>If you don&apos;t have an account, click on</p>
        <button type="button" className={css.linkButton} onClick={switchToRegistration}>
          Registration
        </button>
      </div>
    </div>
  );
}
