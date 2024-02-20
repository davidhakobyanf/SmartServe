// CardDataContext.js
import React, {createContext, useState, useContext, useEffect} from 'react';
import clientAPI from "../api/api";

const ProfileDataContext = createContext();

export const ProfileDataProvider = ({ children }) => {
    const [profileDataList, setProfileDataList] = useState([]);

    const fetchProfile = async () => {
        try {
            const { data: res } = await clientAPI.getProfile();
            if (res) {
                setProfileDataList(res);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };
    useEffect(() => {
        fetchProfile()
    }, []);
    return (
        <ProfileDataContext.Provider value={{ profileDataList, setProfileDataList, fetchProfile }}>
            {children}
        </ProfileDataContext.Provider>
    );
};

export const useProfileData = () => useContext(ProfileDataContext);
