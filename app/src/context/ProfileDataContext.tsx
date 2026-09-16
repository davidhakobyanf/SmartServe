'use client';

import axios from 'axios';
import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import clientAPI from '@/api/api';
import type { Profile } from '@/types';
import type { Permission } from '@/types/staff';

const emptyProfile: Profile = { name: '', surname: '', card: [] };

export type ProfileConnectionState =
  | 'loading'
  | 'ready'
  | 'reconnecting'
  | 'unavailable'
  | 'expired';

let profileRequest: {
  key: string;
  id: symbol;
  promise: Promise<void>;
} | null = null;
let cachedProfile: Profile | null = null;
let cachedAccessToken: string | null = null;
let cachedPermissions: Permission[] = [];
let cachedProfileLocale: string | null = null;

interface ProfileDataContextValue {
  profileDataList: Profile;
  setProfileDataList: React.Dispatch<React.SetStateAction<Profile>>;
  fetchProfile: (options?: { force?: boolean }) => Promise<void>;
  isLoading: boolean;
  permissions: Permission[];
  connectionState: ProfileConnectionState;
}

const ProfileDataContext = createContext<ProfileDataContextValue | null>(null);

export function ProfileDataProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const locale = useLocale();
  const currentLocaleRef = useRef(locale);
  currentLocaleRef.current = locale;
  const [profileDataList, setProfileDataList] = useState<Profile>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [connectionState, setConnectionState] =
    useState<ProfileConnectionState>('loading');
  const [retryAttempt, setRetryAttempt] = useState(0);

  const fetchProfile = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;
    const accessToken = typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;

    if (!accessToken) {
      cachedProfile = null;
      cachedPermissions = [];
      cachedAccessToken = null;
      cachedProfileLocale = locale;
      setProfileDataList(emptyProfile);
      setPermissions([]);
      setConnectionState('expired');
      setIsLoading(false);
      return;
    }

    if (
      !force &&
      cachedProfile &&
      cachedAccessToken === accessToken &&
      cachedProfileLocale === locale
    ) {
      setProfileDataList(cachedProfile);
      setPermissions(cachedPermissions);
      setConnectionState('ready');
      setIsLoading(false);
      return;
    }

    const requestKey = `${accessToken}:${locale}`;
    if (profileRequest?.key === requestKey) {
      await profileRequest.promise;
      return;
    }

    const requestId = Symbol(requestKey);
    const request = (async () => {
      try {
        setIsLoading(true);
        const { data: response } = await clientAPI.getProfile();
        if (
          currentLocaleRef.current !== locale ||
          localStorage.getItem('accessToken') !== accessToken
        ) {
          return;
        }

        const profile: Profile = { ...response, card: [] };
        cachedProfile = profile;
        cachedPermissions = response.permissions ?? [];
        cachedAccessToken = accessToken;
        cachedProfileLocale = locale;
        setProfileDataList(profile);
        setPermissions(cachedPermissions);
        setConnectionState('ready');
        setRetryAttempt(0);
      } catch (error) {
        if (currentLocaleRef.current !== locale) return;

        const status = axios.isAxiosError(error)
          ? error.response?.status
          : undefined;

        if (status === 401 || status === 403) {
          localStorage.removeItem('accessToken');
          sessionStorage.setItem('smartserve:auth-notice', 'session-expired');
          cachedProfile = null;
          cachedPermissions = [];
          cachedAccessToken = null;
          cachedProfileLocale = null;
          setProfileDataList(emptyProfile);
          setPermissions([]);
          setConnectionState('expired');
          return;
        }

        const hasCachedProfile = Boolean(cachedProfile?.id);
        if (cachedProfile) {
          setProfileDataList(cachedProfile);
          setPermissions(cachedPermissions);
        }
        setConnectionState(hasCachedProfile ? 'reconnecting' : 'unavailable');
        setRetryAttempt((attempt) => attempt + 1);
      } finally {
        if (profileRequest?.id === requestId) {
          setIsLoading(false);
          profileRequest = null;
        }
      }
    })();
    profileRequest = { key: requestKey, id: requestId, promise: request };

    await request;
  }, [locale]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile, pathname]);

  useEffect(() => {
    if (
      connectionState !== 'reconnecting' &&
      connectionState !== 'unavailable'
    ) {
      return;
    }

    const exponent = Math.min(Math.max(retryAttempt - 1, 0), 4);
    const delay = Math.min(30_000, 2_000 * 2 ** exponent);
    const timer = window.setTimeout(() => {
      void fetchProfile({ force: true });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [connectionState, fetchProfile, retryAttempt]);

  useEffect(() => {
    const validateSession = () => {
      if (document.visibilityState === 'visible') {
        void fetchProfile({ force: true });
      }
    };
    const interval = window.setInterval(validateSession, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', validateSession);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', validateSession);
    };
  }, [fetchProfile]);

  return (
    <ProfileDataContext.Provider
      value={{
        profileDataList,
        setProfileDataList,
        fetchProfile,
        isLoading,
        permissions,
        connectionState,
      }}
    >
      {children}
    </ProfileDataContext.Provider>
  );
}

export function useProfileData(): ProfileDataContextValue {
  const context = useContext(ProfileDataContext);
  if (!context) {
    throw new Error('useProfileData must be used within ProfileDataProvider');
  }
  return context;
}
