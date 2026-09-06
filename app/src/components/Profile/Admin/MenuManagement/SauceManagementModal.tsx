'use client';

import MenuAssetManagementPanel from './MenuAssetManagementPanel';

export default function SauceManagementPanel({
  onChanged,
}: {
  onChanged: () => void;
}) {
  return <MenuAssetManagementPanel kind="sauce" onChanged={onChanged} />;
}
