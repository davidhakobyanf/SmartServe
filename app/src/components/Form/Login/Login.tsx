'use client';

import css from './Login.module.css';
import { Button, Form, Input, Checkbox, message } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
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
  const t = useTranslations('auth');
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
        message.success(t('login.toast.success'));
        router.push('/profile/menu');
      } else {
        console.log('Login failed:', data.error);
        message.error(t('login.toast.error'));
      }
    } catch (err) {
      console.error('Error:', err);
      message.error(t('login.toast.error'));
    }
  };

  const switchToRegistration = () => {
    form.resetFields();
    setCheck(true);
  };

  return (
    <div className={css.wrap}>
      <h2 className={css.title}>{t('login.title')}</h2>
      <p className={css.subtitle}>{t('login.subtitle')}</p>

      <Form
        form={form}
        onFinish={handleLogin}
        layout="vertical"
        requiredMark={false}
        className={css.form}
      >
        <Form.Item
          name="email"
          label={t('fields.email.label')}
          rules={[
            { required: true, message: t('fields.email.required') },
            { type: 'email', message: t('fields.email.invalid') },
          ]}
        >
          <Input size="large" placeholder={t('fields.email.placeholder')} />
        </Form.Item>
        <Form.Item
          name="password"
          label={t('fields.password.label')}
          rules={[{ required: true, message: t('fields.password.required') }]}
        >
          <Input.Password
            size="large"
            placeholder={t('fields.password.placeholder')}
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <div className={css.row}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>{t('login.rememberMe')}</Checkbox>
          </Form.Item>
          <button type="button" className={css.link}>
            {t('login.forgotPassword')}
          </button>
        </div>

        <Button type="primary" htmlType="submit" size="large" block>
          {t('login.submit')}
        </Button>
      </Form>

      <p className={css.switch}>
        {t('login.noAccount')}{' '}
        <button type="button" className={css.link} onClick={switchToRegistration}>
          {t('login.registerLink')}
        </button>
      </p>
    </div>
  );
}
