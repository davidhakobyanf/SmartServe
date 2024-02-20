// CardDataContext.js
import React, {createContext, useState, useContext, useEffect} from 'react';
import clientAPI from "../api/api";

const ProfileDataContext = createContext();

export const ProfileDataProvider = ({ children }) => {
    const [profileDataList, setProfileDataList] = useState([]);
    const [profileTransaction, setProfileTransaction] = useState([]);

    const fetchProfile = async () => {
        try {
            const { data: res } = await clientAPI.getProfile();
            if (res) {
                setProfileDataList(res);
                setProfileTransaction(res.transaction)
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };
    useEffect(() => {
        fetchProfile()
    }, []);
    return (
        <ProfileDataContext.Provider value={{ profileDataList,profileTransaction, setProfileDataList, setProfileTransaction, fetchProfile }}>
            {children}
        </ProfileDataContext.Provider>
    );
};

export const useProfileData = () => useContext(ProfileDataContext);
