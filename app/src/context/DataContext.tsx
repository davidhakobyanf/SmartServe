'use client';

import {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from 'react';
import type { MenuCard } from '@/types';

interface DataContextValue {
  orderIsLoading: boolean;
  setOrderIsLoading: (value: boolean) => void;
  cardActive: Partial<MenuCard>;
  setCardActive: React.Dispatch<React.SetStateAction<Partial<MenuCard>>>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [orderIsLoading, setOrderIsLoading] = useState(false);
  const [cardActive, setCardActive] = useState<Partial<MenuCard>>({});

  useEffect(() => {
    console.log(orderIsLoading, 'orderIsLoading');
  }, [orderIsLoading]);

  return (
    <DataContext.Provider
      value={{ orderIsLoading, setOrderIsLoading, cardActive, setCardActive }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within DataProvider');
  }
  return ctx;
}
