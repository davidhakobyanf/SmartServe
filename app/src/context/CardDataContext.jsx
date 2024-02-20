// CardDataContext.js
import React, {createContext, useState, useContext, useEffect} from 'react';
import clientAPI from "../api/api";

const CardDataContext = createContext();

export const CardDataProvider = ({ children }) => {
    const [cardDataList, setCardDataList] = useState([]);

    const fetchProfile = async () => {
        try {
            const { data: res } = await clientAPI.getProfile();
            if (res) {
                setCardDataList(res.card);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };
    useEffect(() => {
      fetchProfile()
    }, []);
    return (
        <CardDataContext.Provider value={{ cardDataList, setCardDataList, fetchProfile }}>
            {children}
        </CardDataContext.Provider>
    );
};

export const useCardData = () => useContext(CardDataContext);
