import type { OrderStatus } from './restaurant';

export type DashboardPeriod = 'today' | '7d' | '30d';

export interface DashboardMetrics {
  orders: number | null;
  activeOrders: number | null;
  revenue: number | null;
  averageCheck: number | null;
  occupiedTables: number | null;
  totalTables: number | null;
}

export interface DashboardSeriesPoint {
  bucket: string;
  orders: number;
  placed: number;
  preparing: number;
  ready: number;
  completed: number;
  revenue: number | null;
}

export interface DashboardOrder {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  total: number | null;
  createdAt: string;
  itemCount: number;
  ageMinutes: number;
}

export interface DashboardProduct {
  productId: string;
  title: string;
  quantity: number;
  revenue: number | null;
}

export interface DashboardLowStockProduct {
  id: string;
  title: string;
  stockQuantity: number;
}

export interface DashboardData {
  period: DashboardPeriod;
  timezone: string;
  metrics: DashboardMetrics;
  statusCounts: Pick<Record<OrderStatus, number>, 'placed' | 'preparing' | 'ready'> | null;
  series: DashboardSeriesPoint[];
  recentOrders: DashboardOrder[];
  topProducts: DashboardProduct[];
  lowStock: DashboardLowStockProduct[];
}
