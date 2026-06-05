'use client';

import css from './ProfileInfo.module.css';
import { useProfileData } from '@/context/ProfileDataContext';
import LoadingSpin from '@/hoc/LoadingSpin';

export default function ProfileInfo() {
  const { profileDataList, isLoading } = useProfileData();

  if (isLoading) {
    return (
      <LoadingSpin>
        <div>Loading...</div>
      </LoadingSpin>
    );
  }

  return (
    <div className={css.profile_name}>
      {profileDataList.name ? (
        <div className={css.profile_username}>
          <div className={css.text}>
            <p>
              {profileDataList.name} {profileDataList.surname}
            </p>
          </div>
        </div>
      ) : (
        <p>User not found</p>
      )}
    </div>
  );
}
