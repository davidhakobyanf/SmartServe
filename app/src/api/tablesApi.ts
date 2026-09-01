import { apiClient } from './api';
import type { RestaurantTable, TablePayload } from '@/types/tables';

const tablesApi = {
  async getTables(): Promise<RestaurantTable[]> {
    const { data } = await apiClient.get<RestaurantTable[]>('/api/tables');
    return data;
  },

  async createTable(payload: TablePayload): Promise<RestaurantTable> {
    const { data } = await apiClient.post<RestaurantTable>('/api/tables', payload);
    return data;
  },

  async updateTable(
    tableId: string,
    payload: Partial<TablePayload>,
  ): Promise<RestaurantTable> {
    const { data } = await apiClient.patch<RestaurantTable>(
      `/api/tables/${tableId}`,
      payload,
    );
    return data;
  },

  async closeSession(sessionId: string): Promise<void> {
    await apiClient.patch(`/api/sessions/${sessionId}/close`);
  },
};

export default tablesApi;
