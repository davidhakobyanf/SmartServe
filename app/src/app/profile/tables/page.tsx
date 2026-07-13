'use client';

import { TbTable } from 'react-icons/tb';
import Placeholder from '@/components/Profile/Placeholder/Placeholder';

export default function TablesPage() {
  return (
    <Placeholder
      icon={<TbTable />}
      title="Tables"
      subtitle="Manage tables and generate client links"
    />
  );
}
