import { categoryImageApiUrl, sauceImageApiUrl } from '@/lib/entityImages';
import type { CategoryRecord, SauceRecord } from '@/types/restaurant';

export type MenuAssetKind = 'category' | 'sauce';
export type MenuAssetRecord = CategoryRecord | SauceRecord;

export function getMenuAssetValue(kind: MenuAssetKind, asset: MenuAssetRecord): number {
  return kind === 'category' ? (asset as CategoryRecord).sortOrder : Number((asset as SauceRecord).price);
}

export function getMenuAssetImageUrl(kind: MenuAssetKind, asset: MenuAssetRecord): string | undefined {
  if (!asset.imageName) return undefined;
  return kind === 'category'
    ? categoryImageApiUrl(asset.id, asset.updatedAt)
    : sauceImageApiUrl(asset.id, asset.updatedAt);
}
