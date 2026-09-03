export interface MenuCardImage {
  name: string;
  mimeType?: string;
  hasData?: boolean;
}

export interface MenuSauce {
  id: string;
  name: string;
  price: number;
  isActive?: boolean;
}

export interface MenuCard {
  id: string;
  basketItemId?: string;
  categoryId?: string;
  categoryName?: string;
  title: string;
  description: string;
  price: number;
  sauces: MenuSauce[];
  sauceIds?: string[];
  active: boolean;
  image: MenuCardImage;
  table?: string | number;
  count?: number;
}

export type {
  BasketItemRecord,
  CategoryRecord,
  OrderItemRecord,
  OrderStatus,
  ProductRecord,
  RelationalOrder,
  SauceRecord,
  SauceSnapshotRecord,
} from './restaurant';

export interface Profile {
  name: string;
  surname: string;
  email?: string;
  card: MenuCard[];
}

export interface MenuImage {
  id: string;
  src: string;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  name: string;
  surname: string;
  email: string;
  password: string;
}
