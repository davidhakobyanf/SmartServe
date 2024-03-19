// CardDataContext.js
import React, {createContext, useState, useContext, useEffect} from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
const [orderIsLoading, setOrderIsLoading] = useState(false)
    const [cardActive, setCardActive] = useState({})

    useEffect(() => {
        console.log(orderIsLoading,'orderIsLoading')
    }, [orderIsLoading]);
    return (
        <DataContext.Provider value={{ orderIsLoading, setOrderIsLoading,cardActive, setCardActive}}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
