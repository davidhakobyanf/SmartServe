import axios, { type AxiosResponse } from 'axios';
import { API_URL } from '@/lib/apiUrl';
import type { MenuCard, Profile } from '@/types';
import type { DiningSession } from '@/types/tables';
import type {
  BasketItemRecord,
  CategoryRecord,
  OrderStatus,
  ProductRecord,
  RelationalOrder,
} from '@/types/restaurant';
import type { AuthenticatedStaff } from '@/types/staff';

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


type BasketPayload = MenuCard & { count: number };
type OrderPayload = {
  items: unknown[];
  allPrice: number;
};

class DataApi {
  static async getCategories(): Promise<AxiosResponse<CategoryRecord[]>> {
    return instance.get('/api/categories');
  }

  static async createCategory(payload: {
    name: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<AxiosResponse<CategoryRecord>> {
    return instance.post('/api/categories', payload);
  }

  static async updateCategory(
    id: string,
    payload: Partial<Pick<CategoryRecord, 'name' | 'sortOrder' | 'isActive'>>,
  ): Promise<AxiosResponse<CategoryRecord>> {
    return instance.patch(`/api/categories/${id}`, payload);
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
    sauces?: string[];
  }): Promise<AxiosResponse<BasketItemRecord>> {
    return instance.post('/api/basket-items', payload);
  }

  static async updateBasketItem(
    id: string,
    payload: { quantity?: number; sauces?: string[] },
  ): Promise<AxiosResponse<BasketItemRecord>> {
    return instance.patch(`/api/basket-items/${id}`, payload);
  }

  static async removeBasketItem(id: string): Promise<AxiosResponse<{ success: true }>> {
    return instance.delete(`/api/basket-items/${id}`);
  }

  static async clearBasketItems(): Promise<AxiosResponse<{ success: true }>> {
    return instance.delete('/api/basket-items');
  }

  static async getSessionOrders(): Promise<AxiosResponse<RelationalOrder[]>> {
    return instance.get('/api/orders/mine');
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

  static async getBasket(): Promise<AxiosResponse<unknown>> {
    return instance.get('/api/basket', {
      headers: {
        Authorization: 'Bearer ',
        'Content-Type': 'application/json',
      },
    });
  }
  static async getMine(): Promise<AxiosResponse<MenuCard[]>> {
    return instance.get<MenuCard[]>('/api/basket/mine');
  }
  static async clearMine(): Promise<AxiosResponse<unknown>> {
    return instance.delete('/api/basket/mine');
  }

  static async createCard(card: Partial<MenuCard>): Promise<AxiosResponse<ProductRecord>> {
    return instance.post<ProductRecord>('/api/products', {
      categoryId: card.categoryId,
      title: card.title,
      description: card.description,
      price: card.price,
      sauces: card.sauces ?? [],
      isActive: card.active ?? true,
      image: card.image,
    });
  }

  static async createBasket(card: BasketPayload): Promise<AxiosResponse<unknown>> {
    return instance.patch('/api/basket', card, {
      headers: {
        Authorization: 'Bearer',
        'Content-Type': 'application/json',
      },
    });
  }

  static async createOrder(card: OrderPayload): Promise<AxiosResponse<unknown>> {
    return instance.patch('/api/orders', card, {
      headers: {
        Authorization: 'Bearer',
        'Content-Type': 'application/json',
      },
    });
  }

  static async deleteAllBasket(table: string | number): Promise<AxiosResponse<unknown>> {
    return instance.request({
      url: '/api/basket/all',
      method: 'delete',
      headers: {
        Authorization: 'Bearer',
        'Content-Type': 'application/json',
      },
      data: { table },
    });
  }

  static async deleteAllOrders(): Promise<void> {
    const { data } = await this.getOrders();
    await Promise.all(
      data
        .filter((order) => order.status === 'placed')
        .map((order) => this.updateOrderStatus(order.id, 'cancelled')),
    );
  }

  static async deleteOrder(id: string): Promise<AxiosResponse<RelationalOrder>> {
    return this.updateOrderStatus(id, 'cancelled');
  }

  static async deleteBasket(
    id: string,
    sauces?: string[],
  ): Promise<AxiosResponse<unknown>> {
    return instance.request({
      url: '/api/basket',
      method: 'delete',
      headers: {
        Authorization: 'Bearer',
        'Content-Type': 'application/json',
      },
      data: { id, sauces },
    });
  }

  static async deleteCard(id: string): Promise<AxiosResponse<ProductRecord>> {
    return instance.patch(`/api/products/${id}`, { isActive: false });
  }

  static async editCard(card: Partial<MenuCard>): Promise<AxiosResponse<ProductRecord>> {
    if (!card.id) throw new Error('Product id is required');
    return instance.patch(`/api/products/${card.id}`, {
      ...(card.categoryId !== undefined ? { categoryId: card.categoryId } : {}),
      ...(card.title !== undefined ? { title: card.title } : {}),
      ...(card.description !== undefined ? { description: card.description } : {}),
      ...(card.price !== undefined ? { price: card.price } : {}),
      ...(card.sauces !== undefined ? { sauces: card.sauces } : {}),
      ...(card.active !== undefined ? { isActive: card.active } : {}),
      ...(card.image !== undefined ? { image: card.image } : {}),
    });
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
