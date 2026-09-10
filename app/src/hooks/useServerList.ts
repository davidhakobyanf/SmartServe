'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { apiClient, requestAuthScope } from '@/api/api';
import { RequestPool, coalesceRefresh } from '@/lib/requestPool';

const requests = new RequestPool();

export interface PageResult<T> {
  items: T[];
  total: number;
  unfilteredTotal: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats?: Record<string, number>;
  filterCounts?: Record<string, number>;
}
export type ListQuery = Record<string, string | number | undefined>;
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const timer = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(timer); }, [value, delay]);
  return debounced;
}

// The request key includes every filter and locale. Old responses can never
// replace a newer page, including when a socket event refreshes the list.
export function useServerList<T>(endpoint: string, query: ListQuery = {}, enabled = true, scope = '') {
  const locale = useLocale();
  const key = JSON.stringify({ endpoint, query, locale, scope, auth: requestAuthScope() });
  const currentKey = useRef(key);
  currentKey.current = key;
  const requestVersion = useRef(0);
  const [result, setResult] = useState<{ key: string; data: PageResult<T> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const releases = useRef(new Set<() => void>());
  const refresh = useCallback(async () => {
    if (!enabled) return;
    const version = ++requestVersion.current;
    const { endpoint: url, query: params, locale: requestedLocale } = JSON.parse(key);
    setLoading(true);
    setError(false);
    const request = requests.acquire(key, signal => apiClient.get<PageResult<T>>(url, { params, signal, timeout: 15000, headers: { 'Accept-Language': requestedLocale } }));
    releases.current.add(request.release);
    try {
      const { data } = await request.promise;
      if (currentKey.current === key && version === requestVersion.current) setResult({ key, data });
    } catch {
      if (currentKey.current === key && version === requestVersion.current) setError(true);
    } finally {
      request.release();
      releases.current.delete(request.release);
      if (currentKey.current === key && version === requestVersion.current) setLoading(false);
    }
  }, [key, enabled]);
  useEffect(() => {
    const versionRef = requestVersion;
    const activeReleases = releases.current;
    void refresh();
    return () => { ++versionRef.current; activeReleases.forEach(release => release()); activeReleases.clear(); };
  }, [refresh]);
  const scheduler = useRef<ReturnType<typeof coalesceRefresh> | null>(null);
  useEffect(() => {
    const next = coalesceRefresh(refresh);
    scheduler.current = next;
    return () => next.dispose();
  }, [refresh]);
  const invalidate = useCallback(() => scheduler.current?.schedule(), []);
  const data = enabled && result?.key === key ? result.data : undefined;
  return { data, items: data?.items ?? [], loading: enabled && (loading || (!data && !error)), error, refresh, invalidate };
}
