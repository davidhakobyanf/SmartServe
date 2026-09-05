'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import clientAPI from '@/api/api';
import type { VenueSettingsRecord } from '@/types/restaurant';

const defaultSettings: VenueSettingsRecord = {
  venueName: 'SmartServe',
  currency: 'AMD',
  timezone: 'Asia/Yerevan',
};

interface VenueSettingsContextValue {
  settings: VenueSettingsRecord;
  isLoading: boolean;
  refreshSettings: (authenticated?: boolean) => Promise<VenueSettingsRecord>;
  updateSettings: (
    values: Pick<VenueSettingsRecord, 'venueName' | 'currency' | 'timezone'>,
  ) => Promise<VenueSettingsRecord>;
}

const VenueSettingsContext = createContext<VenueSettingsContextValue | null>(
  null,
);

export function VenueSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<VenueSettingsRecord>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const applySettings = useCallback((next: Partial<VenueSettingsRecord>) => {
    setSettings((current) => ({ ...current, ...next }));
  }, []);

  const refreshSettings = useCallback(
    async (authenticated = false) => {
      try {
        const { data } = authenticated
          ? await clientAPI.getVenueSettings()
          : await clientAPI.getPublicVenueSettings();
        applySettings(data);
        return { ...defaultSettings, ...data };
      } finally {
        setIsLoading(false);
      }
    },
    [applySettings],
  );

  const updateSettings = useCallback(
    async (
      values: Pick<
        VenueSettingsRecord,
        'venueName' | 'currency' | 'timezone'
      >,
    ) => {
      const { data } = await clientAPI.updateVenueSettings(values);
      applySettings(data);
      return data;
    },
    [applySettings],
  );

  useEffect(() => {
    void refreshSettings().catch(() => undefined);
  }, [refreshSettings]);

  useEffect(() => {
    document.title = settings.venueName;
  }, [settings.venueName]);

  return (
    <VenueSettingsContext.Provider
      value={{ settings, isLoading, refreshSettings, updateSettings }}
    >
      {children}
    </VenueSettingsContext.Provider>
  );
}

export function useVenueSettings(): VenueSettingsContextValue {
  const context = useContext(VenueSettingsContext);
  if (!context) {
    throw new Error('useVenueSettings must be used within VenueSettingsProvider');
  }
  return context;
}
