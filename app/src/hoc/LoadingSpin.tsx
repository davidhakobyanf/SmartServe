'use client';

import { Spin } from 'antd';
import type { ReactNode } from 'react';

export default function LoadingSpin({ children }: { children?: ReactNode }) {
  return (
    <Spin tip="Loading" size="large" className="loadingClass">
      <div className="content">{children}</div>
    </Spin>
  );
}
