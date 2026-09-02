'use client';

import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import clientAPI from '@/api/api';
import type { Profile } from '@/types';
import type { Permission } from '@/types/staff';
import { productToMenuCard } from '@/lib/normalizeMenuCard';

const emptyProfile: Profile = { name: '', surname: '', card: [] };

let profileRequest: Promise<void> | null = null;
let cachedProfile: Profile | null = null;
let cachedForAuthenticatedUser = false;
let cachedPermissions: Permission[] = [];

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
      cachedForAuthenticatedUser === hasAccessToken
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
      setProfileDataList(emptyProfile);
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    if (profileRequest) {
      await profileRequest;
      return;
    }

    profileRequest = (async () => {
      try {
        setIsLoading(true);
        const { data: currentUser } = await clientAPI.getMe();
        const [{ data: res }, productsResponse] = await Promise.all([
          clientAPI.getProfile(),
          currentUser.permissions.includes('menu.view')
            ? clientAPI.getProducts()
            : Promise.resolve({ data: [] }),
        ]);
        if (res) {
          const cards = productsResponse.data.map(productToMenuCard);
          const profile = { ...res, card: cards };
          cachedProfile = profile;
          cachedPermissions = currentUser.permissions ?? [];
          cachedForAuthenticatedUser = true;
          setProfileDataList(profile);
          setPermissions(cachedPermissions);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        cachedPermissions = [];
        setPermissions([]);
      } finally {
        setIsLoading(false);
        profileRequest = null;
      }
    })();

    await profileRequest;
  }, []); 

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
