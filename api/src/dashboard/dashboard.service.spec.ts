import { DataSource } from "typeorm";
import { Permission } from "src/common/auth/permission";
import { userFixture } from "src/contracts/fixtures";
import { VenueSettingsService } from "src/venue-settings/venue-settings.service";
import { DashboardService } from "./dashboard.service";

describe("DashboardService", () => {
  const venueSettings = {
    get: jest.fn(async () => ({ timezone: "Asia/Yerevan" })),
  };

  beforeEach(() => jest.clearAllMocks());

  it("returns one permission-aware operational snapshot", async () => {
    const query = jest.fn()
      .mockResolvedValueOnce([{
        period_orders: "8", active_orders: "3", placed: "1",
        preparing: "1", ready: "1", revenue: "12500", average_check: "6250",
      }])
      .mockResolvedValueOnce([{ bucket: "2026-09-10T12:00:00", orders: "2", revenue: "5500" }])
      .mockResolvedValueOnce([{
        id: "order-1", table_number: "7", status: "preparing", total: "5500",
        created_at: new Date("2026-09-10T08:00:00Z"), item_count: "2", age_minutes: "12",
      }])
      .mockResolvedValueOnce([{
        product_id: "product-1", title: "Բուրգեր", quantity: "4", revenue: "8000",
      }])
      .mockResolvedValueOnce([{ total_tables: "10", active_tables: "9", occupied_tables: "3" }])
      .mockResolvedValueOnce([{ id: "product-2", title: "Աղցան", stock_quantity: "2" }]);
    const service = new DashboardService(
      { query } as unknown as DataSource,
      venueSettings as unknown as VenueSettingsService,
    );
    const user = userFixture([
      Permission.DASHBOARD_VIEW,
      Permission.ORDERS_VIEW,
      Permission.REVENUE_VIEW,
      Permission.TABLES_VIEW,
      Permission.MENU_VIEW,
    ]);

    const result = await service.get("today", user, "am");

    expect(query).toHaveBeenCalledTimes(6);
    expect(result).toMatchObject({
      period: "today",
      timezone: "Asia/Yerevan",
      metrics: {
        orders: 8,
        activeOrders: 3,
        revenue: 12500,
        averageCheck: 6250,
        occupiedTables: 3,
        totalTables: 10,
      },
      statusCounts: { placed: 1, preparing: 1, ready: 1 },
      series: [{ bucket: "2026-09-10T12:00:00", orders: 2, revenue: 5500 }],
      recentOrders: [{ id: "order-1", tableNumber: 7, total: 5500, itemCount: 2, ageMinutes: 12 }],
      topProducts: [{ productId: "product-1", title: "Բուրգեր", quantity: 4, revenue: 8000 }],
      lowStock: [{ id: "product-2", title: "Աղցան", stockQuantity: 2 }],
    });
  });

  it("does not query or expose sections without their permissions", async () => {
    const query = jest.fn();
    const service = new DashboardService(
      { query } as unknown as DataSource,
      venueSettings as unknown as VenueSettingsService,
    );

    const result = await service.get(
      "7d",
      userFixture([Permission.DASHBOARD_VIEW]),
      "ru",
    );

    expect(query).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      period: "7d",
      metrics: {
        orders: null,
        activeOrders: null,
        revenue: null,
        averageCheck: null,
        occupiedTables: null,
        totalTables: null,
      },
      statusCounts: null,
      series: [],
      recentOrders: [],
      topProducts: [],
      lowStock: [],
    });
  });
});
