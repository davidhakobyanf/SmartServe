'use client';

import { TbSettings } from 'react-icons/tb';
import Placeholder from '@/components/Profile/Placeholder/Placeholder';

export default function SettingsPage() {
  return (
    <Placeholder
      icon={<TbSettings />}
      title="Settings"
      subtitle="Configure your restaurant preferences"
    />
  );
}
