export interface MenuCardImage {
  name: string;
  mimeType?: string;
  hasData?: boolean;
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
