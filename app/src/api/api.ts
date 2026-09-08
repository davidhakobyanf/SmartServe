import axios, { type AxiosResponse } from 'axios';
import { API_URL } from '@/lib/apiUrl';
import type { Profile } from '@/types';
import type { DiningSession } from '@/types/tables';
import type {
  BasketItemRecord,
  CategoryRecord,
  ImageUploadPayload,
  OrderStatus,
  ProductRecord,
  PublicVenueSettingsRecord,
  RelationalOrder,
  SauceRecord,
  VenueSettingsRecord,
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
  static async getPublicVenueSettings(): Promise<
    AxiosResponse<PublicVenueSettingsRecord>
  > {
    return instance.get('/api/venue-settings/public');
  }

  static async getVenueSettings(): Promise<AxiosResponse<VenueSettingsRecord>> {
    return instance.get('/api/venue-settings');
  }

  static async updateVenueSettings(
    payload: Pick<VenueSettingsRecord, 'venueName' | 'currency' | 'timezone'>,
  ): Promise<AxiosResponse<VenueSettingsRecord>> {
    return instance.patch('/api/venue-settings', payload);
  }

  static async getCategories(): Promise<AxiosResponse<CategoryRecord[]>> {
    return instance.get('/api/categories');
  }

  static async createCategory(payload: {
    name?: string;
    nameTranslations?: LocalizedText;
    sortOrder?: number;
    isActive?: boolean;
    image?: ImageUploadPayload;
  }): Promise<AxiosResponse<CategoryRecord>> {
    return instance.post('/api/categories', payload);
  }

  static async updateCategory(
    id: string,
    payload: Partial<
      Pick<CategoryRecord, 'name' | 'nameTranslations' | 'sortOrder' | 'isActive'>
    > & { image?: ImageUploadPayload; removeImage?: boolean },
  ): Promise<AxiosResponse<CategoryRecord>> {
    return instance.patch(`/api/categories/${id}`, payload);
  }

  static async deleteCategory(
    id: string,
  ): Promise<AxiosResponse<{ success: true }>> {
    return instance.delete(`/api/categories/${id}`);
  }

  static async getSauces(): Promise<AxiosResponse<SauceRecord[]>> {
    return instance.get('/api/sauces');
  }

  static async createSauce(payload: {
    name?: string;
    nameTranslations?: LocalizedText;
    price: number;
    isActive?: boolean;
    image?: ImageUploadPayload;
  }): Promise<AxiosResponse<SauceRecord>> {
    return instance.post('/api/sauces', payload);
  }

  static async updateSauce(
    id: string,
    payload: Partial<
      Pick<SauceRecord, 'name' | 'nameTranslations' | 'price' | 'isActive'>
    > & { image?: ImageUploadPayload; removeImage?: boolean },
  ): Promise<AxiosResponse<SauceRecord>> {
    return instance.patch(`/api/sauces/${id}`, payload);
  }

  static async deleteSauce(
    id: string,
  ): Promise<AxiosResponse<{ success: true }>> {
    return instance.delete(`/api/sauces/${id}`);
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

  static async deleteProduct(
    id: string,
  ): Promise<AxiosResponse<{ success: true }>> {
    return instance.delete(`/api/products/${id}`);
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

  static async getMyOrders(sessionToken: string): Promise<AxiosResponse<RelationalOrder[]>> {
    return instance.get('/api/orders/mine', { headers: { 'x-session-token': sessionToken } });
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

  static async updateProfile(payload: {
    name?: string;
    surname?: string;
    email?: string;
  }): Promise<AxiosResponse<Profile>> {
    return instance.patch<Profile>('/api/profile', payload);
  }

  static async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<AxiosResponse<{ success: true }>> {
    return instance.patch('/api/profile/password', payload);
  }

  static async updateAvatar(
    image: ImageUploadPayload,
  ): Promise<AxiosResponse<{ avatarName: string; updatedAt: string }>> {
    return instance.put('/api/profile/avatar', { image });
  }

  static async removeAvatar(): Promise<
    AxiosResponse<{ success: true; updatedAt: string }>
  > {
    return instance.delete('/api/profile/avatar');
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
