import { Alert, Button, Pagination, Spin } from 'antd';
import { useTranslations } from 'next-intl';
import type { PageResult } from '@/hooks/useServerList';

export default function ListPagination({ data, loading, error, onChange, onRetry }: {
  data?: Omit<PageResult<unknown>, 'items'>;
  loading: boolean;
  error: boolean;
  onChange: (page: number, pageSize: number) => void;
  onRetry: () => Promise<void>;
}) {
  const t = useTranslations('common.list');
  return <div style={{ display: 'grid', gap: 12, padding: '18px 0' }}>
    {error && <Alert type="error" showIcon message={t('error')} action={<Button onClick={() => void onRetry()}>{t('retry')}</Button>} />}
    {loading && <Spin />}
    {data && <Pagination current={data.page} pageSize={data.pageSize} total={data.total}
      disabled={loading} showSizeChanger pageSizeOptions={[12, 24, 48, 96]} responsive
      showTotal={(total) => t('total', { total })} onChange={onChange} />}
  </div>;
}
