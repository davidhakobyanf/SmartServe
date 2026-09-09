'use client';
import { useEffect, useState } from 'react';
import { Select, Spin, type SelectProps } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { useDebouncedValue, useServerList } from '@/hooks/useServerList';

interface Option { value: string; label: string; }
interface Props extends Omit<SelectProps, 'options'> {
  resource: 'categories' | 'sauces' | 'roles';
  guest?: boolean;
  activeOnly?: boolean;
  enabled?: boolean;
  initialOptions?: Option[];
  allLabel?: string;
}

export default function RemoteSelect({ resource, guest, activeOnly, enabled = true, initialOptions = [], allLabel, ...props }: Props) {
  const locale = useLocale();
  const t = useTranslations('common.list');
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [batch, setBatch] = useState<{ key: string; options: Option[] }>({ key: '', options: [] });
  const key = `${resource}:${guest}:${activeOnly}:${locale}:${debounced}`;
  const list = useServerList<{ id: string; name: string }>(`/api/${guest ? 'guest-lists' : 'lists'}/${resource}`, {
    search: debounced, page: batch.key === key ? page : 1, pageSize: 24,
    isActive: activeOnly ? 'true' : undefined,
  }, enabled);
  useEffect(() => {
    if (!list.data) return;
    const next = list.data.items.map(item => ({ value: item.id, label: item.name }));
    const actualPage = list.data.page;
    setBatch(current => ({ key, options: actualPage === 1 || current.key !== key ? next : Array.from(new Map([...current.options, ...next].map(option => [option.value, option])).values()) }));
    setPage(actualPage);
  }, [list.data, key]);
  const options = batch.key === key ? batch.options : [];
  const selected = Array.isArray(props.value) ? props.value : [props.value];
  const merged = Array.from(new Map([
    ...(allLabel ? [{ value: 'all', label: allLabel }] : []),
    ...initialOptions.filter(option => selected.includes(option.value)), ...options,
  ].map(option => [option.value, option])).values());
  return <Select {...props} showSearch filterOption={false} options={merged} loading={list.loading}
    onSearch={(value) => { setPage(1); setSearch(value); }}
    onPopupScroll={(event) => {
      const target = event.currentTarget;
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24 && !list.loading && list.data && page < list.data.totalPages) setPage(page + 1);
    }}
    notFoundContent={list.loading ? <Spin size="small" /> : list.error ? <button type="button" onClick={() => void list.refresh()}>{t('retry')}</button> : t('empty')} />;
}
