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

interface ProfileDataContextValue {
  profileDataList: Profile;
  setProfileDataList: React.Dispatch<React.SetStateAction<Profile>>;
  fetchProfile: () => Promise<void>;
}

const ProfileDataContext = createContext<ProfileDataContextValue | null>(null);

export function ProfileDataProvider({ children }: { children: ReactNode }) {
  const [profileDataList, setProfileDataList] = useState<Profile>(emptyProfile);

  const fetchProfile = useCallback(async () => {
    try {
      const { data: res } = await clientAPI.getProfile();
      if (res) {
        setProfileDataList(res);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return (
    <ProfileDataContext.Provider
      value={{ profileDataList, setProfileDataList, fetchProfile }}
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
