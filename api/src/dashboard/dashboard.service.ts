import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { Permission } from "src/common/auth/permission";
import { getEffectivePermissions } from "src/common/auth/effective-permissions";
import {
  normalizeContentLocale,
} from "src/common/i18n/localized-text";
import { User } from "src/entities/user.entity";
import { VenueSettingsService } from "src/venue-settings/venue-settings.service";
import { DashboardPeriod } from "./dto/dashboard-query.dto";

const PERIOD_DAYS: Record<DashboardPeriod, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
};

const number = (value: unknown): number => Number(value ?? 0);

@Injectable()
export class DashboardService {
  constructor(
    private readonly db: DataSource,
    private readonly venueSettings: VenueSettingsService,
  ) {}

  async get(
    period: DashboardPeriod,
    user: User,
    requestedLocale?: string,
  ) {
    const permissions = new Set(getEffectivePermissions(user));
    const canViewOrders = permissions.has(Permission.ORDERS_VIEW);
    const canViewRevenue = canViewOrders && permissions.has(Permission.REVENUE_VIEW);
    const canViewTables = permissions.has(Permission.TABLES_VIEW);
    const canViewMenu = permissions.has(Permission.MENU_VIEW);
    const settings = await this.venueSettings.get();
    const timezone = this.validTimezone(settings.timezone);
    const locale = normalizeContentLocale(requestedLocale);
    const days = PERIOD_DAYS[period];
    const bucketUnit = period === "today" ? "hour" : "day";
    const bucketStep = period === "today" ? "1 hour" : "1 day";
    const bucketFormat = period === "today"
      ? `YYYY-MM-DD"T"HH24:00:00`
      : "YYYY-MM-DD";

    const [orderMetrics, series, recentOrders, topProducts, tableMetrics, lowStock] =
      await Promise.all([
        canViewOrders
          ? this.db.query(
              `WITH bounds AS (
                SELECT date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE $1)
                  - (($2::int - 1) * interval '1 day') AS started_at
              )
              SELECT
                COUNT(*) FILTER (
                  WHERE o.status <> 'cancelled'
                    AND (o."createdAt" AT TIME ZONE $1) >= b.started_at
                ) AS period_orders,
                COUNT(*) FILTER (WHERE o.status IN ('placed', 'preparing', 'ready')) AS active_orders,
                COUNT(*) FILTER (WHERE o.status = 'placed') AS placed,
                COUNT(*) FILTER (WHERE o.status = 'preparing') AS preparing,
                COUNT(*) FILTER (WHERE o.status = 'ready') AS ready,
                COALESCE(SUM(o.total) FILTER (
                  WHERE o.status = 'completed'
                    AND (o."createdAt" AT TIME ZONE $1) >= b.started_at
                ), 0) AS revenue,
                COALESCE(AVG(o.total) FILTER (
                  WHERE o.status = 'completed'
                    AND (o."createdAt" AT TIME ZONE $1) >= b.started_at
                ), 0) AS average_check
              FROM orders o CROSS JOIN bounds b`,
              [timezone, days],
            )
          : Promise.resolve([]),
        canViewOrders
          ? this.db.query(
              `WITH bounds AS (
                SELECT
                  date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE $1)
                    - (($2::int - 1) * interval '1 day') AS started_at,
                  date_trunc('${bucketUnit}', CURRENT_TIMESTAMP AT TIME ZONE $1) AS ended_at
              ), buckets AS (
                SELECT generate_series(started_at, ended_at, interval '${bucketStep}') AS bucket
                FROM bounds
              )
              SELECT
                to_char(b.bucket, '${bucketFormat}') AS bucket,
                COUNT(o.id) FILTER (WHERE o.status <> 'cancelled') AS orders,
                COUNT(o.id) FILTER (WHERE o.status = 'placed') AS placed,
                COUNT(o.id) FILTER (WHERE o.status = 'preparing') AS preparing,
                COUNT(o.id) FILTER (WHERE o.status = 'ready') AS ready,
                COUNT(o.id) FILTER (WHERE o.status = 'completed') AS completed,
                COALESCE(SUM(o.total) FILTER (WHERE o.status = 'completed'), 0) AS revenue
              FROM buckets b
              LEFT JOIN orders o
                ON date_trunc('${bucketUnit}', o."createdAt" AT TIME ZONE $1) = b.bucket
              GROUP BY b.bucket
              ORDER BY b.bucket ASC`,
              [timezone, days],
            )
          : Promise.resolve([]),
        canViewOrders
          ? this.db.query(
              `SELECT
                o.id,
                t.number AS table_number,
                o.status,
                o.total,
                o."createdAt" AS created_at,
                COALESCE(SUM(i.quantity), 0) AS item_count,
                FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o."createdAt")) / 60) AS age_minutes
              FROM orders o
              INNER JOIN tables t ON t.id = o."tableId"
              LEFT JOIN order_items i ON i."orderId" = o.id
              WHERE o.status IN ('placed', 'preparing', 'ready')
              GROUP BY o.id, t.number
              ORDER BY o."createdAt" ASC, o.id ASC
              LIMIT 6`,
            )
          : Promise.resolve([]),
        canViewOrders
          ? this.db.query(
              `WITH bounds AS (
                SELECT date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE $1)
                  - (($2::int - 1) * interval '1 day') AS started_at
              ), sold AS (
                SELECT
                  COALESCE(i."productId"::text, i."titleSnapshot") AS product_id,
                  COALESCE(
                    NULLIF(BTRIM(p."titleTranslations"->>$3), ''),
                    NULLIF(BTRIM(p."titleTranslations"->>'en'), ''),
                    NULLIF(BTRIM(p."titleTranslations"->>'am'), ''),
                    NULLIF(BTRIM(p."titleTranslations"->>'ru'), ''),
                    p.title,
                    i."titleSnapshot"
                  ) AS title,
                  i.quantity,
                  i."lineTotal" AS line_total
                FROM order_items i
                INNER JOIN orders o ON o.id = i."orderId"
                LEFT JOIN products p ON p.id = i."productId"
                CROSS JOIN bounds b
                WHERE o.status <> 'cancelled'
                  AND (o."createdAt" AT TIME ZONE $1) >= b.started_at
              )
              SELECT
                product_id,
                title,
                SUM(quantity) AS quantity,
                SUM(line_total) AS revenue
              FROM sold
              GROUP BY product_id, title
              ORDER BY quantity DESC, title ASC
              LIMIT 5`,
              [timezone, days, locale],
            )
          : Promise.resolve([]),
        canViewTables
          ? this.db.query(
              `SELECT
                COUNT(*) AS total_tables,
                COUNT(*) FILTER (WHERE t."isActive") AS active_tables,
                COUNT(s.id) AS occupied_tables
              FROM tables t
              LEFT JOIN dining_sessions s
                ON s."tableId" = t.id AND s.status = 'open'`,
            )
          : Promise.resolve([]),
        canViewMenu
          ? this.db.query(
              `SELECT
                p.id,
                COALESCE(
                  NULLIF(BTRIM(p."titleTranslations"->>$1), ''),
                  NULLIF(BTRIM(p."titleTranslations"->>'en'), ''),
                  NULLIF(BTRIM(p."titleTranslations"->>'am'), ''),
                  NULLIF(BTRIM(p."titleTranslations"->>'ru'), ''),
                  p.title
                ) AS title,
                p."stockQuantity" AS stock_quantity
              FROM products p
              WHERE p."isActive" = true
                AND p."stockQuantity" IS NOT NULL
                AND p."stockQuantity" <= 5
              ORDER BY p."stockQuantity" ASC, title ASC
              LIMIT 5`,
              [locale],
            )
          : Promise.resolve([]),
      ]);

    const orders = orderMetrics[0];
    const tables = tableMetrics[0];

    return {
      period,
      timezone,
      metrics: {
        orders: canViewOrders ? number(orders?.period_orders) : null,
        activeOrders: canViewOrders ? number(orders?.active_orders) : null,
        revenue: canViewRevenue ? number(orders?.revenue) : null,
        averageCheck: canViewRevenue ? number(orders?.average_check) : null,
        occupiedTables: canViewTables ? number(tables?.occupied_tables) : null,
        totalTables: canViewTables ? number(tables?.total_tables) : null,
      },
      statusCounts: canViewOrders
        ? {
            placed: number(orders?.placed),
            preparing: number(orders?.preparing),
            ready: number(orders?.ready),
          }
        : null,
      series: series.map((row: Record<string, unknown>) => ({
        bucket: String(row.bucket),
        orders: number(row.orders),
        placed: number(row.placed),
        preparing: number(row.preparing),
        ready: number(row.ready),
        completed: number(row.completed),
        revenue: canViewRevenue ? number(row.revenue) : null,
      })),
      recentOrders: recentOrders.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        tableNumber: number(row.table_number),
        status: String(row.status),
        total: canViewRevenue ? number(row.total) : null,
        createdAt: row.created_at,
        itemCount: number(row.item_count),
        ageMinutes: number(row.age_minutes),
      })),
      topProducts: topProducts.map((row: Record<string, unknown>) => ({
        productId: String(row.product_id),
        title: String(row.title),
        quantity: number(row.quantity),
        revenue: canViewRevenue ? number(row.revenue) : null,
      })),
      lowStock: lowStock.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        title: String(row.title),
        stockQuantity: number(row.stock_quantity),
      })),
    };
  }

  private validTimezone(value: string): string {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value }).format();
      return value;
    } catch {
      return "UTC";
    }
  }
}
