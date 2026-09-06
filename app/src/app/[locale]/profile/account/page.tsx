'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  App,
  Avatar,
  Button,
  Form,
  Input,
  Spin,
  Tabs,
  Tag,
  Upload,
  type UploadProps,
} from 'antd';
import ImgCrop from 'antd-img-crop';
import { useLocale, useTranslations } from 'next-intl';
import {
  TbCamera,
  TbDeviceFloppy,
  TbKey,
  TbLock,
  TbMail,
  TbShieldCheck,
  TbTrash,
  TbUser,
} from 'react-icons/tb';
import clientAPI from '@/api/api';
import { useProfileData } from '@/context/ProfileDataContext';
import { profileImageApiUrl } from '@/lib/entityImages';
import { fileToImagePayload } from '@/lib/fileToImagePayload';
import css from './AccountPage.module.css';

interface PersonalFormValues {
  name: string;
  surname: string;
  email: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function AccountPage() {
  const t = useTranslations('account');
  const permissionT = useTranslations('staff.permissionLabels');
  const locale = useLocale();
  const { message, modal } = App.useApp();
  const { profileDataList, permissions, fetchProfile, isLoading } = useProfileData();
  const [personalForm] = Form.useForm<PersonalFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    personalForm.setFieldsValue({
      name: profileDataList.name,
      surname: profileDataList.surname,
      email: profileDataList.email ?? '',
    });
  }, [personalForm, profileDataList]);

  const fullName = [profileDataList.name, profileDataList.surname]
    .filter(Boolean)
    .join(' ');
  const initials = `${profileDataList.name?.[0] ?? ''}${
    profileDataList.surname?.[0] ?? ''
  }`.toUpperCase() || 'U';
  const avatarSrc =
    profileDataList.id && profileDataList.avatarName
      ? profileImageApiUrl(profileDataList.id, profileDataList.updatedAt)
      : undefined;

  const formatDate = (value?: string | null) => {
    if (!value) return t('never');
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  };

  const validateAvatar: NonNullable<UploadProps['beforeUpload']> = (file) => {
    if (!AVATAR_MIME_TYPES.has(file.type)) {
      message.error(t('avatar.invalid'));
      return false;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      message.error(t('avatar.tooLarge'));
      return false;
    }
    return true;
  };

  const uploadAvatar: NonNullable<UploadProps['beforeUpload']> = async (file) => {
    try {
      setSavingAvatar(true);
      await clientAPI.updateAvatar(await fileToImagePayload(file as File));
      await fetchProfile({ force: true });
      message.success(t('avatar.saved'));
    } catch {
      message.error(t('avatar.saveError'));
    } finally {
      setSavingAvatar(false);
    }
    return Upload.LIST_IGNORE;
  };

  const removeAvatar = () => {
    modal.confirm({
      title: t('avatar.deleteConfirm'),
      content: t('avatar.deleteHint'),
      okText: t('delete'),
      cancelText: t('cancel'),
      okType: 'danger',
      onOk: async () => {
        try {
          setSavingAvatar(true);
          await clientAPI.removeAvatar();
          await fetchProfile({ force: true });
          message.success(t('avatar.deleted'));
        } catch {
          message.error(t('avatar.deleteError'));
        } finally {
          setSavingAvatar(false);
        }
      },
    });
  };

  const saveProfile = async (values: PersonalFormValues) => {
    try {
      setSavingProfile(true);
      await clientAPI.updateProfile(values);
      await fetchProfile({ force: true });
      message.success(t('personal.saved'));
    } catch {
      message.error(t('personal.saveError'));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (values: PasswordFormValues) => {
    try {
      setSavingPassword(true);
      await clientAPI.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.resetFields();
      message.success(t('security.saved'));
    } catch {
      message.error(t('security.saveError'));
    } finally {
      setSavingPassword(false);
    }
  };

  const permissionLabels = useMemo(
    () =>
      permissions.map((permission) => ({
        permission,
        label: permissionT(permission.replaceAll('.', '_')),
      })),
    [permissionT, permissions],
  );

  if (isLoading && !profileDataList.id) {
    return (
      <div className={css.loading}>
        <Spin size="large" />
        <span>{t('loading')}</span>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'personal',
      label: t('tabs.personal'),
      children: (
        <section className={css.card}>
          <div className={css.cardHeader}>
            <span className={css.icon}><TbUser /></span>
            <div><h2>{t('personal.title')}</h2><p>{t('personal.subtitle')}</p></div>
          </div>
          <Form form={personalForm} layout="vertical" requiredMark={false} className={css.form} onFinish={saveProfile}>
            <div className={css.formGrid}>
              <Form.Item name="name" label={t('personal.name')} rules={[{ required: true, whitespace: true, message: t('personal.nameRequired') }, { min: 2, max: 100, message: t('personal.nameLength') }]}>
                <Input prefix={<TbUser />} />
              </Form.Item>
              <Form.Item name="surname" label={t('personal.surname')} rules={[{ required: true, whitespace: true, message: t('personal.surnameRequired') }, { min: 2, max: 100, message: t('personal.surnameLength') }]}>
                <Input prefix={<TbUser />} />
              </Form.Item>
            </div>
            <Form.Item name="email" label={t('personal.email')} rules={[{ required: true, message: t('personal.emailRequired') }, { type: 'email', message: t('personal.emailInvalid') }]}>
              <Input prefix={<TbMail />} />
            </Form.Item>
            <div className={css.actions}>
              <Button type="primary" htmlType="submit" icon={<TbDeviceFloppy />} loading={savingProfile}>{t('save')}</Button>
            </div>
          </Form>
        </section>
      ),
    },
    {
      key: 'security',
      label: t('tabs.security'),
      children: (
        <section className={css.card}>
          <div className={css.cardHeader}>
            <span className={css.icon}><TbLock /></span>
            <div><h2>{t('security.title')}</h2><p>{t('security.subtitle')}</p></div>
          </div>
          <Form form={passwordForm} layout="vertical" requiredMark={false} className={css.form} onFinish={savePassword}>
            <Form.Item name="currentPassword" label={t('security.currentPassword')} rules={[{ required: true, message: t('security.currentRequired') }]}>
              <Input.Password prefix={<TbKey />} autoComplete="current-password" />
            </Form.Item>
            <Form.Item name="newPassword" label={t('security.newPassword')} extra={t('security.passwordHint')} rules={[{ required: true, message: t('security.newRequired') }, { pattern: PASSWORD_PATTERN, message: t('security.passwordInvalid') }]}>
              <Input.Password prefix={<TbLock />} autoComplete="new-password" />
            </Form.Item>
            <Form.Item name="confirmPassword" label={t('security.confirmPassword')} dependencies={['newPassword']} rules={[{ required: true, message: t('security.confirmRequired') }, ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue('newPassword') === value ? Promise.resolve() : Promise.reject(new Error(t('security.passwordMismatch'))); } })]}>
              <Input.Password prefix={<TbShieldCheck />} autoComplete="new-password" />
            </Form.Item>
            <div className={css.actions}>
              <Button type="primary" htmlType="submit" loading={savingPassword}>{t('security.changePassword')}</Button>
            </div>
          </Form>
        </section>
      ),
    },
    {
      key: 'access',
      label: t('tabs.access'),
      children: (
        <section className={css.card}>
          <div className={css.cardHeader}>
            <span className={css.icon}><TbShieldCheck /></span>
            <div><h2>{t('access.title')}</h2><p>{t('access.subtitle')}</p></div>
          </div>
          <div className={css.accessBody}>
            <div className={css.accessSummary}>
              <div><span>{t('access.role')}</span><strong>{profileDataList.role?.name ?? t('access.noRole')}</strong></div>
              <div><span>{t('access.status')}</span><Tag color="green">{t(`statuses.${profileDataList.status ?? 'active'}`)}</Tag></div>
            </div>
            <div className={css.permissions}>
              {permissionLabels.map(({ permission, label }) => (
                <span key={permission} className={css.permission}><TbShieldCheck /> {label}</span>
              ))}
            </div>
          </div>
        </section>
      ),
    },
  ];

  return (
    <div className={css.wrap}>
      <header><h1 className={css.title}>{t('pageTitle')}</h1><p className={css.subtitle}>{t('pageSubtitle')}</p></header>

      <section className={css.identityCard}>
        <div className={css.avatarColumn}>
          <ImgCrop aspect={1} cropShape="round" showGrid={false} zoomSlider rotationSlider showReset quality={0.9} beforeCrop={validateAvatar} modalTitle={t('avatar.editorTitle')} modalOk={t('avatar.apply')} modalCancel={t('cancel')} resetText={t('avatar.reset')} modalProps={{ centered: true }}>
            <Upload accept="image/jpeg,image/png,image/webp" showUploadList={false} beforeUpload={uploadAvatar} disabled={savingAvatar}>
              <button type="button" className={css.avatarButton} disabled={savingAvatar}>
                <Avatar size={126} src={avatarSrc}>{initials}</Avatar>
                <span className={css.camera}><TbCamera /></span>
                {savingAvatar && <span className={css.avatarLoading}><Spin /></span>}
              </button>
            </Upload>
          </ImgCrop>
          <span className={css.avatarHint}>{t('avatar.hint')}</span>
          {profileDataList.avatarName && (
            <Button type="text" danger size="small" icon={<TbTrash />} onClick={removeAvatar} disabled={savingAvatar}>{t('avatar.delete')}</Button>
          )}
        </div>

        <div className={css.identity}>
          <div className={css.nameRow}><h2>{fullName || t('notFound')}</h2><Tag color="green">{t(`statuses.${profileDataList.status ?? 'active'}`)}</Tag></div>
          <p>{profileDataList.email}</p>
          <span className={css.role}>{profileDataList.role?.name ?? t('access.noRole')}</span>
          <div className={css.meta}>
            <span><strong>{t('registered')}</strong>{formatDate(profileDataList.createdAt)}</span>
            <span><strong>{t('lastLogin')}</strong>{formatDate(profileDataList.lastLoginAt)}</span>
          </div>
        </div>
      </section>

      <Tabs className={css.tabs} items={tabItems} destroyOnHidden={false} />
    </div>
  );
}
