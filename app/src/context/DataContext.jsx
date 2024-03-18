// CardDataContext.js
import React, {createContext, useState, useContext, useEffect} from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
const [orderIsLoading, setOrderIsLoading] = useState(false)
    return (
        <DataContext.Provider value={{ orderIsLoading, setOrderIsLoading}}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
