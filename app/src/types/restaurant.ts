export interface CategoryRecord {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SauceRecord {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SauceSnapshotRecord {
  id: string;
  name: string;
  unitPrice: number;
}

export interface ProductRecord {
  id: string;
  categoryId: string;
  category: CategoryRecord;
  title: string;
  description: string;
  price: number;
  sauces: SauceRecord[];
  isActive: boolean;
  imageName: string | null;
  imageMimeType: string | null;
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

export type OrderStatus = 'placed' | 'completed' | 'cancelled';

export interface OrderItemRecord {
  id: string;
  productId: string | null;
  titleSnapshot: string;
  descriptionSnapshot: string;
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
