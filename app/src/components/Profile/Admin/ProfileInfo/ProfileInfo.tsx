'use client';

import css from './ProfileInfo.module.css';
import { useTranslations } from 'next-intl';
import { useProfileData } from '@/context/ProfileDataContext';
import LoadingSpin from '@/hoc/LoadingSpin';

export default function ProfileInfo() {
  const t = useTranslations('account');
  const { profileDataList, isLoading } = useProfileData();

  if (isLoading) {
    return (
      <LoadingSpin>
        <div>{t('loading')}</div>
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
        <p>{t('notFound')}</p>
      )}
    </div>
  );
}
