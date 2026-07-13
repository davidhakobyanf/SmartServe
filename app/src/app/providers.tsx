'use client';

import '@ant-design/v5-patch-for-react-19';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { DataProvider } from '@/context/DataContext';
import { ProfileDataProvider } from '@/context/ProfileDataContext';

const theme = {
  token: {
    colorPrimary: '#5b4fe8',
    colorInfo: '#5b4fe8',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorText: '#1e293b',
    colorTextSecondary: '#64748b',
    colorBorder: '#e9edf3',
    borderRadius: 10,
    fontFamily:
      "var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    controlHeight: 40,
  },
  components: {
    Button: {
      controlHeight: 44,
      fontWeight: 600,
      primaryShadow: 'none',
    },
    Input: {
      controlHeight: 44,
    },
    Select: {
      controlHeight: 44,
    },
    Modal: {
      borderRadiusLG: 20,
    },
  },
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme}>
        <DataProvider>
          <ProfileDataProvider>{children}</ProfileDataProvider>
        </DataProvider>
      </ConfigProvider>
    </AntdRegistry>
  );
}
