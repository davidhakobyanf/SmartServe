'use client';

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

let profileRequest: {
  key: string;
  id: symbol;
  promise: Promise<void>;
} | null = null;
let cachedProfile: Profile | null = null;
let cachedForAuthenticatedUser = false;
let cachedPermissions: Permission[] = [];
let cachedProfileLocale: string | null = null;

interface ProfileDataContextValue {
  profileDataList: Profile;
  setProfileDataList: React.Dispatch<React.SetStateAction<Profile>>;
  fetchProfile: (options?: { force?: boolean }) => Promise<void>;
  isLoading: boolean;
  permissions: Permission[];
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

  const fetchProfile = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;
    const hasAccessToken =
      typeof window !== 'undefined' &&
      Boolean(localStorage.getItem('accessToken'));

    if (
      !force &&
      cachedProfile &&
      cachedForAuthenticatedUser === hasAccessToken &&
      cachedProfileLocale === locale
    ) {
      setProfileDataList(cachedProfile);
      setPermissions(cachedPermissions);
      setIsLoading(false);
      return;
    }

    if (!hasAccessToken) {
      cachedProfile = emptyProfile;
      cachedPermissions = [];
      cachedForAuthenticatedUser = false;
      cachedProfileLocale = locale;
      setProfileDataList(emptyProfile);
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    const requestKey = `${hasAccessToken}:${locale}`;
    if (profileRequest?.key === requestKey) {
      await profileRequest.promise;
      return;
    }

    const requestId = Symbol(requestKey);
    const request = (async () => {
      try {
        setIsLoading(true);
        const { data: currentUser } = await clientAPI.getMe();
        const { data: res } = await clientAPI.getProfile();
        if (res && currentLocaleRef.current === locale) {
          const profile = { ...res, card: [] };
          cachedProfile = profile;
          cachedPermissions = currentUser.permissions ?? [];
          cachedForAuthenticatedUser = true;
          cachedProfileLocale = locale;
          setProfileDataList(profile);
          setPermissions(cachedPermissions);
        }
      } catch {
        if (currentLocaleRef.current === locale) {
          cachedPermissions = [];
          setPermissions([]);
        }
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

  return (
    <ProfileDataContext.Provider
      value={{
        profileDataList,
        setProfileDataList,
        fetchProfile,
        isLoading,
        permissions,
      }}
    >
      {children}
    </ProfileDataContext.Provider>
  );
}

export function useProfileData(): ProfileDataContextValue {
  const ctx = useContext(ProfileDataContext);
  if (!ctx) {
    throw new Error('useProfileData must be used within ProfileDataProvider');
  }
  return ctx;
}
