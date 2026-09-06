'use client';

import MenuAssetManagementPanel from './MenuAssetManagementPanel';

export default function CategoryManagementPanel({
  onChanged,
}: {
  onChanged: () => void;
}) {
  return <MenuAssetManagementPanel kind="category" onChanged={onChanged} />;
}
