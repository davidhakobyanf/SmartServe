'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { apiClient, requestAuthScope } from '@/api/api';
import { RequestPool, coalesceRefresh } from '@/lib/requestPool';
import type { DashboardData, DashboardPeriod } from '@/types/dashboard';

const requests = new RequestPool();

export function useDashboardData(period: DashboardPeriod, enabled: boolean) {
  const locale = useLocale();
  const key = JSON.stringify({ period, locale, auth: requestAuthScope() });
  const currentKey = useRef(key);
  currentKey.current = key;
  const version = useRef(0);
  const releases = useRef(new Set<() => void>());
  const [result, setResult] = useState<{ key: string; data: DashboardData } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const requestVersion = ++version.current;
    setLoading(true);
    setError(false);
    const request = requests.acquire(key, signal => apiClient.get<DashboardData>('/api/dashboard', {
      params: { period },
      signal,
      timeout: 15000,
      headers: { 'Accept-Language': locale },
    }));
    releases.current.add(request.release);
    try {
      const { data } = await request.promise;
      if (currentKey.current === key && requestVersion === version.current) {
        setResult({ key, data });
      }
    } catch {
      if (currentKey.current === key && requestVersion === version.current) setError(true);
    } finally {
      request.release();
      releases.current.delete(request.release);
      if (currentKey.current === key && requestVersion === version.current) setLoading(false);
    }
  }, [enabled, key, locale, period]);

  useEffect(() => {
    const versionRef = version;
    const activeReleases = releases.current;
    void refresh();
    return () => {
      ++versionRef.current;
      activeReleases.forEach(release => release());
      activeReleases.clear();
    };
  }, [refresh]);

  const scheduler = useRef<ReturnType<typeof coalesceRefresh> | null>(null);
  useEffect(() => {
    const next = coalesceRefresh(refresh);
    scheduler.current = next;
    return () => next.dispose();
  }, [refresh]);

  const invalidate = useCallback(() => scheduler.current?.schedule(), []);
  const data = enabled && result?.key === key ? result.data : undefined;

  return {
    data,
    loading: enabled && (loading || (!data && !error)),
    error,
    refresh,
    invalidate,
  };
}
