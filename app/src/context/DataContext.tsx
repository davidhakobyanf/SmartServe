'use client';

import {
  createContext,
  useState,
  useContext,
  type ReactNode,
} from 'react';
import type { MenuCard } from '@/types';

interface DataContextValue {
  cardActive: Partial<MenuCard>;
  setCardActive: React.Dispatch<React.SetStateAction<Partial<MenuCard>>>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [cardActive, setCardActive] = useState<Partial<MenuCard>>({});



  return (
    <DataContext.Provider
      value={{ cardActive, setCardActive }}
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
