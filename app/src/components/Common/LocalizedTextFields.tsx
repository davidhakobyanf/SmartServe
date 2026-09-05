'use client';

import { Form, Input, Tabs } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { useTranslations } from 'next-intl';
import { CONTENT_LOCALES, type ContentLocale } from '@/types/localization';

interface LocalizedTextFieldsProps {
  name: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  maxLength: number;
  required?: boolean;
}

const LANGUAGE_KEYS: Record<ContentLocale, 'lang_en' | 'lang_am' | 'lang_ru'> = {
  en: 'lang_en',
  am: 'lang_am',
  ru: 'lang_ru',
};

export default function LocalizedTextFields({
  name,
  label,
  placeholder,
  multiline = false,
  maxLength,
  required = false,
}: LocalizedTextFieldsProps) {
  const t = useTranslations('common');

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 4, fontWeight: 500 }}>
        {required && <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>}
        {label}
      </div>
      <Tabs
        size="small"
        destroyOnHidden={false}
        items={CONTENT_LOCALES.map((locale) => ({
          key: locale,
          // Keep every language field mounted. File uploads and other sibling
          // state updates re-render the form; lazily mounted tab panes can then
          // lose the displayed value for inactive locales.
          forceRender: true,
          label: `${t(LANGUAGE_KEYS[locale])}${locale === 'en' ? ' ★' : ''}`,
          children: (
            <Form.Item
              name={[name, locale]}
              preserve
              style={{ marginBottom: 0 }}
            >
              {multiline ? (
                <TextArea
                  rows={4}
                  maxLength={maxLength}
                  showCount
                  placeholder={placeholder}
                />
              ) : (
                <Input maxLength={maxLength} placeholder={placeholder} />
              )}
            </Form.Item>
          ),
        }))}
      />
      <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 12 }}>
        {t('translationHint')}
      </div>
    </div>
  );
}
