import axios, { type AxiosResponse } from 'axios';
import { API_URL } from '@/lib/apiUrl';
import type { MenuCard, Profile } from '@/types';
import type { DiningSession } from '@/types/tables';

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
  static async getProfile(): Promise<AxiosResponse<Profile>> {
    return instance.get<Profile>('/api/profile', {
      headers: {
        Authorization: 'Bearer ',
        'Content-Type': 'application/json',
      },
    });
  }

  static async getOrders(): Promise<AxiosResponse<unknown>> {
    return instance.get('/api/orders', {
      headers: {
        Authorization: 'Bearer ',
        'Content-Type': 'application/json',
      },
    });
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

  static async createCard(card: Partial<MenuCard>): Promise<AxiosResponse<Profile>> {
    return instance.patch<Profile>('/api/user/login', card, {
      headers: {
        Authorization: 'Bearer',
        'Content-Type': 'application/json',
      },
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

  static async deleteAllOrders(): Promise<AxiosResponse<unknown>> {
    return instance.request({
      url: '/api/orders/all',
      method: 'delete',
      headers: {
        Authorization: 'Bearer',
        'Content-Type': 'application/json',
      },
      data: {},
    });
  }

  static async deleteOrder(id: string): Promise<AxiosResponse<unknown>> {
    return instance.request({
      url: '/api/orders',
      method: 'delete',
      headers: {
        Authorization: 'Bearer',
        'Content-Type': 'application/json',
      },
      data: { id },
    });
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

  static async deleteCard(id: string): Promise<AxiosResponse<unknown>> {
    return instance.request({
      url: '/api/user/login',
      method: 'delete',
      headers: {
        Authorization: 'Bearer',
        'Content-Type': 'application/json',
      },
      data: { id },
    });
  }

  static async editCard(card: Partial<MenuCard>): Promise<AxiosResponse<unknown>> {
    return instance.put('/api/user/login', card, {
      headers: {
        Authorization: 'Bearer',
        'Content-Type': 'application/json',
      },
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
