'use client';

import { useEffect, useState } from 'react';
import css from './ProfileInfo.module.css';
import { useFetching } from '@/hoc/fetchingHook';
import clientAPI from '@/api/api';
import LoadingSpin from '@/hoc/LoadingSpin';
import type { Profile } from '@/types';

export default function ProfileInfo() {
  const [userData, setUserData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [fetchProfile] = useFetching(async () => {
    try {
      const { data: res } = await clientAPI.getProfile();
      if (res) {
        setUserData(res);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void fetchProfile();
  }, []);

  if (loading) {
    return (
      <LoadingSpin>
        <div>Loading...</div>
      </LoadingSpin>
    );
  }

  return (
    <div className={css.profile_name}>
      {userData ? (
        <div className={css.profile_username}>
          {userData.name ? (
            <div className={css.text}>
              <p>
                {userData.name} {userData.surname}
              </p>
            </div>
          ) : (
            <p>User not found</p>
          )}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
