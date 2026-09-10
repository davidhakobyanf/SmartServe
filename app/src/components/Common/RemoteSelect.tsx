'use client';
import { useEffect, useRef, useState } from 'react';
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

export default function RemoteSelect({ resource, guest, activeOnly, enabled = true, initialOptions = [], allLabel, showSearch = true, ...props }: Props) {
  const locale = useLocale();
  const t = useTranslations('common.list');
  const [search, setSearch] = useState('');
  const [opened, setOpened] = useState(false);
  const fetchedAt = useRef(0);
  const debounced = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const [batch, setBatch] = useState<{ key: string; options: Option[] }>({ key: '', options: [] });
  const key = `${resource}:${guest}:${activeOnly}:${locale}:${debounced}`;
  const labels = useRef(new Map<string, Option>());
  const labelScope = useRef(`${resource}:${locale}`);
  if (labelScope.current !== `${resource}:${locale}`) { labels.current.clear(); labelScope.current = `${resource}:${locale}`; }
  const list = useServerList<{ id: string; name: string; price?: number }>(`/api/${guest ? 'guest-lists' : 'lists'}/${resource}`, {
    search: debounced, page: batch.key === key ? page : 1, pageSize: 24,
    isActive: activeOnly ? 'true' : undefined,
  }, enabled && opened);
  // A selection can come from another control (e.g. the sticky menu filter),
  // and its option may be beyond the first page of this dropdown.
  const selectedId = typeof props.value === 'string' && props.value !== 'all' ? props.value : undefined;
  const selectedDetail = useServerList<{ id: string; name: string }>(`/api/${guest ? 'guest-lists' : 'lists'}/${resource}`, {
    id: selectedId, pageSize: 1, isActive: activeOnly ? 'true' : undefined,
  }, enabled && !!selectedId && !labels.current.has(selectedId) && !initialOptions.some(option => option.value === selectedId));
  useEffect(() => {
    if (!list.data) return;
    fetchedAt.current = Date.now();
    const next = list.data.items.map(item => ({ value: item.id, label: item.name }));
    next.forEach(option => labels.current.set(option.value, option));
    const actualPage = list.data.page;
    setBatch(current => ({ key, options: actualPage === 1 || current.key !== key ? next : Array.from(new Map([...current.options, ...next].map(option => [option.value, option])).values()) }));
    setPage(actualPage);
  }, [list.data, key]);
  const options = batch.key === key ? batch.options : [];
  const selected = Array.isArray(props.value) ? props.value : [props.value];
  const merged = Array.from(new Map([
    ...(allLabel ? [{ value: 'all', label: allLabel }] : []),
    ...selected.flatMap(value => labels.current.has(value) ? [labels.current.get(value)!] : []),
    ...(selectedDetail.data?.items ?? []).filter(item => item.id === selectedId).map(item => ({ value: item.id, label: item.name })),
    ...initialOptions.filter(option => selected.includes(option.value)), ...options,
  ].map(option => [option.value, option])).values());
  return <Select {...props} showSearch={showSearch} filterOption={showSearch ? false : undefined} options={merged} loading={list.loading}
    onOpenChange={(open) => {
      if (open) {
        setOpened(true);
        if (opened && Date.now() - fetchedAt.current > 30000) void list.refresh();
      }
      props.onOpenChange?.(open);
    }}
    onSearch={showSearch ? (value) => { setPage(1); setSearch(value); } : undefined}
    onPopupScroll={(event) => {
      const target = event.currentTarget;
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24 && !list.loading && list.data && page < list.data.totalPages) setPage(page + 1);
    }}
    notFoundContent={list.loading ? <Spin size="small" /> : list.error ? <button type="button" onClick={() => void list.refresh()}>{t('retry')}</button> : t('empty')} />;
}
