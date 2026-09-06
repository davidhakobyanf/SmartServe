'use client';

import css from './Registration.module.css';
import { App, Button, Form, Input } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import type { FormInstance } from 'antd';
import { API_URL } from '@/lib/apiUrl';
import type { RegisterFormValues } from '@/types';

interface RegistrationProps {
  form: FormInstance;
  setCheck: (value: boolean) => void;
}

export default function Registration({ form, setCheck }: RegistrationProps) {
  const t = useTranslations('auth');
  const { message } = App.useApp();
  const success = () => message.success(t('register.toast.success'));
  const showError = () => message.error(t('register.toast.error'));

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
    } catch {
      showError();
    }
  };

  const switchToLogin = () => {
    form.resetFields();
    setCheck(false);
  };

  return (
    <div className={css.wrap}>
      <h2 className={css.title}>{t('register.title')}</h2>
      <p className={css.subtitle}>{t('register.subtitle')}</p>

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
            label={t('fields.name.label')}
            rules={[{ required: true, message: t('fields.name.required') }]}
          >
            <Input size="large" placeholder={t('fields.name.placeholder')} />
          </Form.Item>
          <Form.Item
            name="surname"
            label={t('fields.surname.label')}
            rules={[{ required: true, message: t('fields.surname.required') }]}
          >
            <Input size="large" placeholder={t('fields.surname.placeholder')} />
          </Form.Item>
        </div>
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
          rules={[
            { required: true, message: t('fields.password.required') },
            { min: 6, message: t('fields.password.minLength') },
            {
              pattern:
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/,
              message: t('fields.password.pattern'),
            },
          ]}
        >
          <Input.Password
            size="large"
            placeholder={t('fields.password.placeholder')}
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label={t('fields.confirmPassword.label')}
          dependencies={['password']}
          rules={[
            { required: true, message: t('fields.confirmPassword.required') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(t('fields.confirmPassword.mismatch')),
                );
              },
            }),
          ]}
        >
          <Input.Password
            size="large"
            placeholder={t('fields.confirmPassword.placeholder')}
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="large" block>
          {t('register.submit')}
        </Button>
      </Form>

      <p className={css.switch}>
        {t('register.haveAccount')}{' '}
        <button type="button" className={css.link} onClick={switchToLogin}>
          {t('register.loginLink')}
        </button>
      </p>
    </div>
  );
}
