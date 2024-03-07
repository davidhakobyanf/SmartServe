import React, { useEffect, useState } from 'react';
import css from './ProfileInfo.module.css';
import {useFetching} from "../../../../../src/hoc/fetchingHook";
import clientAPI from "../../../../../src/api/api";
import LoadingSpin from "../../../../../src/hoc/LoadingSpin";

const ProfileInfo = ({ username }) => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);

  const [fetchProfile, profileLoading, profileError] = useFetching(async () => {
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
    fetchProfile()
  }, []);

  if (loading) {
    return (
        <LoadingSpin>
          <div>Loading...</div>
        </LoadingSpin>
    );
  }
  const onSearch = (value, _e, info) => console.log(info?.source, value);

  return (
    <div className={css.profile_name}>
      {userData ? (
        <>
          <div className={css.profile_username}>
            {userData.name ? (
              <div className={css.text}>
                <p>{userData.name} {userData.surname}</p>
              </div>
            ) : (
              <p>User not found</p>
            )}
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default ProfileInfo;
