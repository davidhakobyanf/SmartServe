import type { LocalizedText } from './localization';

export interface ImageUploadPayload {
  name: string;
  mimeType: string;
  data: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  nameTranslations: LocalizedText;
  sortOrder: number;
  isActive: boolean;
  imageName: string | null;
  imageMimeType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SauceRecord {
  id: string;
  name: string;
  nameTranslations: LocalizedText;
  price: number;
  isActive: boolean;
  imageName: string | null;
  imageMimeType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SauceSnapshotRecord {
  id: string;
  name: string;
  nameTranslations?: LocalizedText;
  unitPrice: number;
}

export interface ProductRecord {
  id: string;
  categoryId: string;
  category: CategoryRecord;
  title: string;
  titleTranslations: LocalizedText;
  description: string;
  descriptionTranslations: LocalizedText;
  price: number;
  stockQuantity: number | null;
  sauces: SauceRecord[];
  isActive: boolean;
  imageName: string | null;
  imageMimeType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BasketItemRecord {
  id: string;
  sessionId: string;
  productId: string;
  product: ProductRecord;
  quantity: number;
  sauces: SauceSnapshotRecord[];
  unitPrice: number;
}

export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItemRecord {
  id: string;
  createdAt?: string;
  productId: string | null;
  titleSnapshot: string;
  descriptionSnapshot: string;
  titleTranslationsSnapshot?: LocalizedText;
  descriptionTranslationsSnapshot?: LocalizedText;
  product?: ProductRecord | null;
  unitPrice: number | null;
  quantity: number;
  sauces: SauceSnapshotRecord[];
  lineTotal: number | null;
}

export interface RelationalOrder {
  id: string;
  tableId: string;
  table: { id: string; number: number; name: string | null };
  sessionId: string;
  status: OrderStatus;
  total: number | null;
  completedAt: string | null;
  createdAt: string;
  items: OrderItemRecord[];
}

export interface VenueSettingsRecord {
  id?: number;
  venueName: string;
  currency: string;
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PublicVenueSettingsRecord = Pick<
  VenueSettingsRecord,
  'venueName' | 'currency'
>;
