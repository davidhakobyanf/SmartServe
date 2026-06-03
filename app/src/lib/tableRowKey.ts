import type { MenuCard } from '@/types';

/** Stable row key for Ant Design Table (rowKey index arg is deprecated in antd 5.29+) */
export function menuCardRowKey(record: MenuCard, prefix = 'row'): string {
  if (record.id) return String(record.id);
  return `${prefix}-${record.title ?? 'item'}-${record.price}-${record.count ?? 0}`;
}
