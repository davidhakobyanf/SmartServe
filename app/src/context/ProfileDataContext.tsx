'use client';

import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import clientAPI from '@/api/api';
import type { Profile } from '@/types';

const emptyProfile: Profile = { name: '', surname: '', card: [] };

let profileRequest: Promise<void> | null = null;
let cachedProfile: Profile | null = null;

interface ProfileDataContextValue {
  profileDataList: Profile;
  setProfileDataList: React.Dispatch<React.SetStateAction<Profile>>;
  fetchProfile: (options?: { force?: boolean }) => Promise<void>;
  isLoading: boolean;
}

const ProfileDataContext = createContext<ProfileDataContextValue | null>(null);

export function ProfileDataProvider({ children }: { children: ReactNode }) {
  const [profileDataList, setProfileDataList] = useState<Profile>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;

    if (!force && cachedProfile) {
      setProfileDataList(cachedProfile);
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
        const { data: res } = await clientAPI.getProfile();
        if (res) {
          cachedProfile = res;
          setProfileDataList(res);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
        profileRequest = null;
      }
    })();

    await profileRequest;
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return (
    <ProfileDataContext.Provider
      value={{ profileDataList, setProfileDataList, fetchProfile, isLoading }}
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
