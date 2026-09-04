'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  App,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  QRCode,
  Spin,
  Switch,
  Tag,
} from 'antd';
import {
  TbCopy,
  TbDownload,
  TbEdit,
  TbPlus,
  TbQrcode,
  TbRefresh,
  TbTable,
  TbX,
} from 'react-icons/tb';
import tablesApi from '@/api/tablesApi';
import type { RestaurantTable, TablePayload } from '@/types/tables';
import css from './TablesManagement.module.css';
import { useProfileData } from '@/context/ProfileDataContext';
import LocalizedTextFields from '@/components/Common/LocalizedTextFields';
import {
  cleanLocalizedText,
  hasLocalizedText,
  missingContentLocales,
  type LocalizedText,
} from '@/types/localization';

interface TableFormValues {
  number: number;
  nameTranslations?: LocalizedText;
  isActive: boolean;
}

export default function TablesManagement() {
  const t = useTranslations('tables');
  const commonT = useTranslations('common');
  const { message } = App.useApp();
  const { permissions } = useProfileData();
  const canManageTables = permissions.includes('tables.manage');
  const canManageQr = permissions.includes('tables.qr.manage');
  const [form] = Form.useForm<TableFormValues>();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => setOrigin(window.location.origin), []);

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      setTables(await tablesApi.getTables());
    } catch {
      message.error(t('messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  const stats = useMemo(
    () => ({
      total: tables.length,
      open: tables.filter((table) => table.activeSession).length,
      available: tables.filter((table) => table.isActive && !table.activeSession)
        .length,
      inactive: tables.filter((table) => !table.isActive).length,
    }),
    [tables],
  );

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setFormOpen(true);
  };

  const openEdit = (table: RestaurantTable) => {
    setEditing(table);
    form.setFieldsValue({
      number: table.number,
      nameTranslations: table.nameTranslations,
      isActive: table.isActive,
    });
    setFormOpen(true);
  };

  const submit = async (values: TableFormValues) => {
    const payload: TablePayload = {
      number: values.number,
      nameTranslations: cleanLocalizedText(values.nameTranslations),
      isActive: values.isActive,
    };

    setSaving(true);
    try {
      if (editing) {
        await tablesApi.updateTable(editing.id, payload);
        message.success(t('messages.updated'));
      } else {
        await tablesApi.createTable(payload);
        message.success(t('messages.created'));
      }
      if (hasLocalizedText(values.nameTranslations)) {
        const missing = missingContentLocales(values.nameTranslations);
        if (missing.length > 0) {
          message.warning(
            commonT('missingTranslations', {
              languages: missing
                .map((locale) => commonT(`lang_${locale}`))
                .join(', '),
            }),
          );
        }
      }
      setFormOpen(false);
      form.resetFields();
      await loadTables();
    } catch {
      message.error(t('messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const closeSession = async (table: RestaurantTable) => {
    if (!table.activeSession) return;
    try {
      await tablesApi.closeSession(table.activeSession.id);
      message.success(t('messages.closed'));
      await loadTables();
    } catch {
      message.error(t('messages.closeError'));
    }
  };

  const qrUrl = (table: RestaurantTable) =>
    `${origin}/t/${encodeURIComponent(table.publicToken ?? '')}`;

  const copyQrUrl = async (table: RestaurantTable) => {
    await navigator.clipboard.writeText(qrUrl(table));
    message.success(t('messages.copied'));
  };

  const downloadQr = (table: RestaurantTable) => {
    const canvas = document
      .getElementById('table-qr-preview')
      ?.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `smartserve-table-${table.number}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className={css.page}>
      <header className={css.header}>
        <div>
          <h1 className={css.title}>{t('pageTitle')}</h1>
          <p className={css.subtitle}>{t('pageSubtitle')}</p>
        </div>
        <div className={css.headerActions}>
          <Button icon={<TbRefresh />} onClick={() => void loadTables()}>
            {t('actions.refresh')}
          </Button>
          {canManageTables && (
            <Button type="primary" icon={<TbPlus />} onClick={openCreate}>
              {t('actions.add')}
            </Button>
          )}
        </div>
      </header>

      <div className={css.stats}>
        {(
          [
            ['total', stats.total],
            ['open', stats.open],
            ['available', stats.available],
            ['inactive', stats.inactive],
          ] as const
        ).map(([key, value]) => (
          <div key={key} className={css.stat}>
            <span className={css.statIcon}><TbTable /></span>
            <div>
              <span className={css.statValue}>{value}</span>
              <span className={css.statLabel}>{t(`stats.${key}`)}</span>
            </div>
          </div>
        ))}
      </div>

      <section className={css.card}>
        {loading ? (
          <div className={css.loading}><Spin size="large" /></div>
        ) : tables.length === 0 ? (
          <div className={css.empty}>
            <Empty description={t('empty')} />
            {canManageTables && (
              <Button type="primary" icon={<TbPlus />} onClick={openCreate}>
                {t('actions.addFirst')}
              </Button>
            )}
          </div>
        ) : (
          <div className={css.tableWrap}>
            <table className={css.table}>
              <thead>
                <tr>
                  <th>{t('columns.table')}</th>
                  <th>{t('columns.status')}</th>
                  <th>{t('columns.session')}</th>
                  <th>{t('columns.qr')}</th>
                  <th className={css.right}>{t('columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table) => (
                  <tr key={table.id}>
                    <td>
                      <div className={css.tableName}>{t('tableNumber', { number: table.number })}</div>
                      {table.name && <div className={css.tableNote}>{table.name}</div>}
                    </td>
                    <td>
                      {!table.isActive ? (
                        <Tag>{t('status.inactive')}</Tag>
                      ) : table.activeSession ? (
                        <Tag color="green">{t('status.occupied')}</Tag>
                      ) : (
                        <Tag color="blue">{t('status.available')}</Tag>
                      )}
                    </td>
                    <td>
                      {table.activeSession ? (
                        <span className={css.sessionId} title={table.activeSession.id}>
                          {table.activeSession.id.slice(0, 8)}…
                        </span>
                      ) : (
                        <span className={css.muted}>—</span>
                      )}
                    </td>
                    <td>
                      {canManageQr && table.publicToken ? (
                        <Button icon={<TbQrcode />} onClick={() => setQrTable(table)}>
                          {t('actions.showQr')}
                        </Button>
                      ) : (
                        <span className={css.muted}>—</span>
                      )}
                    </td>
                    <td>
                      <div className={css.rowActions}>
                        {canManageTables && (
                          <Button icon={<TbEdit />} onClick={() => openEdit(table)}>
                            {t('actions.edit')}
                          </Button>
                        )}
                        {canManageTables && table.activeSession && (
                          <Popconfirm
                            title={t('closeConfirm.title')}
                            description={t('closeConfirm.description')}
                            okText={t('closeConfirm.confirm')}
                            cancelText={t('closeConfirm.cancel')}
                            okButtonProps={{ danger: true }}
                            onConfirm={() => void closeSession(table)}
                          >
                            <Button danger icon={<TbX />}>
                              {t('actions.close')}
                            </Button>
                          </Popconfirm>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        title={editing ? t('form.editTitle') : t('form.createTitle')}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText={t('form.save')}
        cancelText={t('form.cancel')}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(values) => void submit(values)}>
          <Form.Item
            name="number"
            label={t('form.number')}
            rules={[{ required: true, message: t('form.numberRequired') }]}
          >
            <InputNumber
              min={1}
              precision={0}
              inputMode="numeric"
              placeholder={t('form.numberPlaceholder')}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <LocalizedTextFields
            name="nameTranslations"
            label={t('form.name')}
            placeholder={t('form.namePlaceholder')}
            maxLength={100}
          />
          <Form.Item name="isActive" label={t('form.active')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={qrTable ? t('qr.title', { number: qrTable.number }) : ''}
        open={Boolean(qrTable)}
        onCancel={() => setQrTable(null)}
        footer={null}
        width={420}
      >
        {qrTable && origin && (
          <div className={css.qrModal}>
            <div id="table-qr-preview" className={css.qrFrame}>
              <QRCode value={qrUrl(qrTable)} size={240} bordered={false} />
            </div>
            <p className={css.qrHint}>{t('qr.hint')}</p>
            <code className={css.qrUrl}>{qrUrl(qrTable)}</code>
            <div className={css.qrActions}>
              <Button icon={<TbCopy />} onClick={() => void copyQrUrl(qrTable)}>
                {t('actions.copy')}
              </Button>
              <Button type="primary" icon={<TbDownload />} onClick={() => downloadQr(qrTable)}>
                {t('actions.download')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
