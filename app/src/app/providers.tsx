'use client';

import '@ant-design/v5-patch-for-react-19';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { DataProvider } from '@/context/DataContext';
import { ProfileDataProvider } from '@/context/ProfileDataContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <DataProvider>
        <ProfileDataProvider>{children}</ProfileDataProvider>
      </DataProvider>
    </AntdRegistry>
  );
}
