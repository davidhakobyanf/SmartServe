'use client';

import { TbLayoutDashboard } from 'react-icons/tb';
import Placeholder from '@/components/Profile/Placeholder/Placeholder';

export default function ProfileDashboardPage() {
  return (
    <Placeholder
      icon={<TbLayoutDashboard />}
      title="Dashboard"
      subtitle="Overview of your restaurant activity"
    />
  );
}
