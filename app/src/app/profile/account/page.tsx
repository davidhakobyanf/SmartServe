'use client';

import { TbUser } from 'react-icons/tb';
import Placeholder from '@/components/Profile/Placeholder/Placeholder';

export default function AccountPage() {
  return (
    <Placeholder
      icon={<TbUser />}
      title="Profile"
      subtitle="Your account details"
    />
  );
}
