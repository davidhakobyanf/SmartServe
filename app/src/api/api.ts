import axios, { type AxiosResponse } from 'axios';
import { API_URL } from '@/lib/apiUrl';
import type { Profile } from '@/types';
import type { DiningSession } from '@/types/tables';
import type {
  BasketItemRecord,
  CategoryRecord,
  OrderStatus,
  ProductRecord,
  RelationalOrder,
  SauceRecord,
} from '@/types/restaurant';
import type { AuthenticatedStaff } from '@/types/staff';
import type { LocalizedText } from '@/types/localization';

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});
let sessionToken: string | null = null;
export function setSessionToken(token: string | null): void {
  sessionToken = token;
}

instance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('accessToken');
    const locale = document.documentElement.lang || 'en';

    config.headers.set('Accept-Language', locale);

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  if (sessionToken) {
    config.headers.set('x-session-token', sessionToken);
  }
  return config;
});

export const apiClient = instance;


class DataApi {
  static async getCategories(): Promise<AxiosResponse<CategoryRecord[]>> {
    return instance.get('/api/categories');
  }

  static async createCategory(payload: {
    name?: string;
    nameTranslations?: LocalizedText;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<AxiosResponse<CategoryRecord>> {
    return instance.post('/api/categories', payload);
  }

  static async updateCategory(
    id: string,
    payload: Partial<
      Pick<CategoryRecord, 'name' | 'nameTranslations' | 'sortOrder' | 'isActive'>
    >,
  ): Promise<AxiosResponse<CategoryRecord>> {
    return instance.patch(`/api/categories/${id}`, payload);
  }

  static async getSauces(): Promise<AxiosResponse<SauceRecord[]>> {
    return instance.get('/api/sauces');
  }

  static async createSauce(payload: {
    name?: string;
    nameTranslations?: LocalizedText;
    price: number;
    isActive?: boolean;
  }): Promise<AxiosResponse<SauceRecord>> {
    return instance.post('/api/sauces', payload);
  }

  static async updateSauce(
    id: string,
    payload: Partial<
      Pick<SauceRecord, 'name' | 'nameTranslations' | 'price' | 'isActive'>
    >,
  ): Promise<AxiosResponse<SauceRecord>> {
    return instance.patch(`/api/sauces/${id}`, payload);
  }

  static async getProducts(): Promise<AxiosResponse<ProductRecord[]>> {
    return instance.get('/api/products');
  }

  static async getPublicMenu(): Promise<AxiosResponse<ProductRecord[]>> {
    return instance.get('/api/menu');
  }

  static async createProduct(payload: Record<string, unknown>): Promise<AxiosResponse<ProductRecord>> {
    return instance.post('/api/products', payload);
  }

  static async updateProduct(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<AxiosResponse<ProductRecord>> {
    return instance.patch(`/api/products/${id}`, payload);
  }

  static async getBasketItems(): Promise<AxiosResponse<BasketItemRecord[]>> {
    return instance.get('/api/basket-items');
  }

  static async addBasketItem(payload: {
    productId: string;
    quantity?: number;
    sauceIds?: string[];
  }): Promise<AxiosResponse<BasketItemRecord>> {
    return instance.post('/api/basket-items', payload);
  }

  static async updateBasketItem(
    id: string,
    payload: { quantity?: number; sauceIds?: string[] },
  ): Promise<AxiosResponse<BasketItemRecord>> {
    return instance.patch(`/api/basket-items/${id}`, payload);
  }

  static async removeBasketItem(id: string): Promise<AxiosResponse<{ success: true }>> {
    return instance.delete(`/api/basket-items/${id}`);
  }

  static async placeOrder(): Promise<AxiosResponse<RelationalOrder>> {
    return instance.post('/api/orders');
  }

  static async updateOrderStatus(
    id: string,
    status: OrderStatus,
  ): Promise<AxiosResponse<RelationalOrder>> {
    return instance.patch(`/api/orders/${id}/status`, { status });
  }

  static async getProfile(): Promise<AxiosResponse<Profile>> {
    return instance.get<Profile>('/api/profile');
  }

  static async getMe(): Promise<AxiosResponse<AuthenticatedStaff>> {
    return instance.get<AuthenticatedStaff>('/api/auth/me');
  }

  static async getOrders(): Promise<AxiosResponse<RelationalOrder[]>> {
    return instance.get<RelationalOrder[]>('/api/orders');
  }

  static async openSession(tableToken: string): Promise<AxiosResponse<DiningSession>> {
    return instance.post<DiningSession>('/api/sessions/open', { tableToken });
  }

  static async getCurrentSession(
    sessionId: string,
  ): Promise<AxiosResponse<DiningSession>> {
    return instance.get<DiningSession>('/api/sessions/current', {
      headers: { 'x-session-token': sessionId },
    });
  }
}

export default DataApi;
