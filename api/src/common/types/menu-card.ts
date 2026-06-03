export interface MenuCardImage {
  name?: string;
  mimeType?: string;
  /** Base64 without data: URL prefix (stored in DB) */
  data?: string;
  /** Set in API responses when image is stored in DB */
  hasData?: boolean;
  uid?: string;
}

export interface MenuCard {
  id: string;
  title: string;
  description: string;
  price: number;
  sauces: string[];
  active: boolean;
  image: MenuCardImage;
  table?: string | number;
  count?: number;
}

export type BasketTables = Record<string, MenuCard[]>;

export interface OrderRecord {
  _id: string;
  items: MenuCard[];
  allPrice: number;
  table: string | number;
  createdAt: string | Date;
}
