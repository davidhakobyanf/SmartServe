import { Injectable } from '@nestjs/common';
import { DataSource, In, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Category } from '../entities/category.entity';
import { Sauce } from '../entities/sauce.entity';
import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { DiningTable } from '../entities/dining-table.entity';
import { ListQueryDto } from './list-query.dto';
import { normalizeContentLocale } from '../common/i18n/localized-text';
import { productResponse } from '../products/product-response';
import { localizedNameResponse } from '../common/i18n/localized-response';
import { ordersResponse } from '../orders/order-response';
import { staffUserResponse } from '../users/user-response';
import { roleResponse } from '../roles/role-response';
import { tableResponse } from '../tables/table-response';

// Only internal, constant column names are passed to these SQL helpers.
export const literalSearch = (value: string) => `%${value.toLowerCase().replace(/[\\%_]/g, '\\$&')}%`;
// PostgreSQL databases using C/POSIX collation do not fold Cyrillic/Armenian
// with ILIKE. Explicit folding keeps all three supported languages searchable.
const upper = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔՕՖ';
const folded = (expression: string) => `LOWER(TRANSLATE(${expression}, '${upper}', '${upper.toLowerCase()}'))`;
const translated = (json: string, legacy: string, locale?: string) =>
  `COALESCE(NULLIF(BTRIM(${json}->>'${normalizeContentLocale(locale)}'), ''), NULLIF(BTRIM(${json}->>'en'), ''), NULLIF(BTRIM(${json}->>'am'), ''), NULLIF(BTRIM(${json}->>'ru'), ''), ${legacy}, '')`;
const textMatch = (json: string, legacy: string) =>
  `(${folded(legacy)} LIKE :search OR EXISTS (SELECT 1 FROM jsonb_each_text(${json}) AS tr WHERE ${folded('tr.value')} LIKE :search))`;

@Injectable()
export class ListingService {
  constructor(private readonly db: DataSource) {}

  private async page<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, query: ListQueryDto) {
    const total = await qb.clone().getCount();
    const pageSize = query.pageSize;
    const totalPages = Math.ceil(total / pageSize);
    const page = Math.min(query.page, Math.max(1, totalPages));
    const items = await qb.offset((page - 1) * pageSize).limit(pageSize).getMany();
    return { items, total, page, pageSize, totalPages };
  }

  async products(query: ListQueryDto, locale?: string, publicMenu = false) {
    const repo = this.db.getRepository(Product);
    const qb = repo.createQueryBuilder('p').innerJoin('p.category', 'c');
    if (publicMenu) qb.where('c.isActive = true');
    const unfilteredTotal = await qb.clone().getCount();
    if (query.id) qb.andWhere('p.id = :id', { id: query.id });
    if (query.categoryId) qb.andWhere('p.categoryId = :categoryId', { categoryId: query.categoryId });
    if (query.sauceId) qb.andWhere(`EXISTS (SELECT 1 FROM product_sauces ps JOIN sauces s ON s.id = ps."sauceId" WHERE ps."productId" = p.id AND ps."sauceId" = :sauceId ${publicMenu ? 'AND s."isActive" = true' : ''})`, { sauceId: query.sauceId });
    if (query.isActive) qb.andWhere('p.isActive = :active', { active: query.isActive === 'true' });
    if (query.search) qb.andWhere(textMatch('p."titleTranslations"', 'p.title'), { search: literalSearch(query.search) });
    qb.addSelect(translated('p."titleTranslations"', 'p.title', locale), 'localized_sort');
    if (publicMenu) qb.addSelect('CASE WHEN p."isActive" AND (p."stockQuantity" IS NULL OR p."stockQuantity" > 0) THEN 0 ELSE 1 END', 'availability_sort').orderBy('availability_sort', 'ASC');
    switch (query.sort) {
      case 'newest': qb.addOrderBy('p.createdAt', 'DESC'); break;
      case 'oldest': qb.addOrderBy('p.createdAt', 'ASC'); break;
      case 'price-asc': qb.addOrderBy('p.price', 'ASC'); break;
      case 'price-desc': qb.addOrderBy('p.price', 'DESC'); break;
      case 'name': qb.addOrderBy('localized_sort', 'ASC'); break;
      default: qb.addOrderBy('c.sortOrder', 'ASC').addOrderBy('localized_sort', 'ASC');
    }
    qb.addOrderBy('p.id', 'ASC');
    const result = await this.page(qb, query);
    // Page products first; joining multiple sauces before LIMIT would truncate products.
    const details = result.items.length ? await repo.find({ where: { id: In(result.items.map(p => p.id)) }, relations: { category: true, sauceLinks: { sauce: true } } }) : [];
    const byId = new Map(details.map(p => [p.id, p]));
    return { ...result, unfilteredTotal, items: result.items.map(p => productResponse(byId.get(p.id)!, publicMenu, locale)) };
  }

  async assets(kind: 'categories' | 'sauces', query: ListQueryDto, locale?: string, publicMenu = false) {
    const repo = this.db.getRepository<Category | Sauce>(kind === 'categories' ? Category : Sauce);
    const qb = repo.createQueryBuilder('a');
    if (publicMenu || query.isActive) qb.where('a.isActive = :active', { active: publicMenu || query.isActive === 'true' });
    if (publicMenu) {
      const exists = kind === 'categories'
        ? `EXISTS (SELECT 1 FROM products p WHERE p."categoryId" = a.id)`
        : `EXISTS (SELECT 1 FROM product_sauces ps JOIN products p ON p.id = ps."productId" JOIN categories c ON c.id = p."categoryId" WHERE ps."sauceId" = a.id AND c."isActive" = true)`;
      qb.andWhere(exists);
    }
    const unfilteredTotal = await qb.clone().getCount();
    if (query.id) qb.andWhere('a.id = :id', { id: query.id });
    if (query.search) qb.andWhere(textMatch('a."nameTranslations"', 'a.name'), { search: literalSearch(query.search) });
    qb.addSelect(translated('a."nameTranslations"', 'a.name', locale), 'localized_sort');
    if (query.sort === 'newest') qb.orderBy('a.createdAt', 'DESC');
    else if (kind === 'sauces' && query.sort?.startsWith('price-')) qb.orderBy('a.price', query.sort === 'price-asc' ? 'ASC' : 'DESC');
    else if (kind === 'categories' && query.sort !== 'name') qb.orderBy('a.sortOrder', 'ASC');
    qb.addOrderBy('localized_sort', 'ASC').addOrderBy('a.id', 'ASC');
    const result = await this.page(qb, query);
    return { ...result, unfilteredTotal, items: result.items.map(a => localizedNameResponse(a, locale)) };
  }

  async orders(query: ListQueryDto, financials: boolean, sessionId?: string) {
    const repo = this.db.getRepository(Order);
    const qb = repo.createQueryBuilder('o').leftJoinAndSelect('o.table', 't');
    if (sessionId) qb.where('o.sessionId = :sessionId', { sessionId });
    const counts = await qb.clone().select('o.status', 'status').addSelect('COUNT(*)', 'count').groupBy('o.status').getRawMany();
    const filterCounts: Record<string, number> = { all: 0, active: 0, history: 0, placed: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0 };
    counts.forEach(row => { filterCounts[row.status] = Number(row.count); filterCounts.all += Number(row.count); });
    filterCounts.history = filterCounts.completed + filterCounts.cancelled;
    filterCounts.active = filterCounts.all - filterCounts.history;
    const aggregate = await qb.clone().select('COUNT(DISTINCT o.tableId)', 'tables').addSelect('SUM(CASE WHEN o.status = \'completed\' THEN o.total ELSE 0 END)', 'revenue').getRawOne();
    const quantity = this.db.createQueryBuilder().select('COALESCE(SUM(i.quantity), 0)', 'items').from('order_items', 'i');
    if (sessionId) quantity.innerJoin('orders', 'o', 'o.id = i."orderId" AND o."sessionId" = :sessionId', { sessionId });
    const stats = { total: filterCounts.all, items: Number((await quantity.getRawOne()).items), tables: Number(aggregate.tables), ...(financials ? { revenue: Number(aggregate.revenue ?? 0) } : {}) };
    const status = query.status;
    if (status === 'active') qb.andWhere("o.status IN ('placed', 'preparing', 'ready')");
    else if (status === 'history') qb.andWhere("o.status IN ('completed', 'cancelled')");
    else if (status && status !== 'all') qb.andWhere('o.status::text = :status', { status });
    if (query.search) qb.andWhere(`(o.id::text ILIKE :search OR t.number::text ILIKE :search OR EXISTS (SELECT 1 FROM order_items i WHERE i."orderId" = o.id AND (${textMatch('i."titleTranslationsSnapshot"', 'i."titleSnapshot"')} OR EXISTS (SELECT 1 FROM jsonb_array_elements(i.sauces) s WHERE ${textMatch("s->'nameTranslations'", "s->>'name'")}))))`, { search: literalSearch(query.search.replace(/^#/, '')) });
    if (!sessionId && status !== 'history') qb.addSelect("CASE WHEN o.status IN ('completed','cancelled') THEN 1 ELSE 0 END", 'archive_sort').orderBy('archive_sort', 'ASC');
    qb.addOrderBy('o.createdAt', sessionId || status === 'history' || query.sort === 'newest' ? 'DESC' : 'ASC').addOrderBy('o.id', 'ASC');
    const result = await this.page(qb, query);
    const details = result.items.length ? await repo.find({ where: { id: In(result.items.map(o => o.id)) }, relations: { table: true, items: true } }) : [];
    const byId = new Map(details.map(o => [o.id, o]));
    return { ...result, unfilteredTotal: filterCounts.all, filterCounts, stats, items: ordersResponse(result.items.map(o => byId.get(o.id)!), financials) };
  }

  async users(query: ListQueryDto, locale?: string) {
    const repo = this.db.getRepository(User);
    const qb = repo.createQueryBuilder('u').leftJoinAndSelect('u.role', 'r');
    const counts = await qb.clone().select('u.status', 'status').addSelect('COUNT(*)', 'count').groupBy('u.status').getRawMany();
    const stats = { total: 0, pending: 0, active: 0 };
    counts.forEach(row => { stats.total += Number(row.count); if (row.status === 'pending' || row.status === 'active') stats[row.status as 'pending' | 'active'] = Number(row.count); });
    if (query.status && query.status !== 'all') qb.andWhere('u.status::text = :status', { status: query.status });
    if (query.search) qb.andWhere(`(${folded("concat_ws(' ', u.name, u.surname, u.email, u.status::text)")} LIKE :search OR ${textMatch('r."nameTranslations"', 'r.name')})`, { search: literalSearch(query.search) });
    qb.orderBy('u.createdAt', 'DESC').addOrderBy('u.id', 'ASC');
    const result = await this.page(qb, query);
    return { ...result, unfilteredTotal: stats.total, stats, items: result.items.map(u => staffUserResponse(u, locale)) };
  }

  async roles(query: ListQueryDto, locale?: string) {
    const qb = this.db.getRepository(Role).createQueryBuilder('r');
    const unfilteredTotal = await qb.clone().getCount();
    if (query.isActive) qb.where('r.isActive = :active', { active: query.isActive === 'true' });
    if (query.id) qb.andWhere('r.id = :id', { id: query.id });
    if (query.search) qb.andWhere(`(${textMatch('r."nameTranslations"', 'r.name')} OR r.code ILIKE :search)`, { search: literalSearch(query.search) });
    qb.addSelect(translated('r."nameTranslations"', 'r.name', locale), 'localized_sort').orderBy('localized_sort', 'ASC').addOrderBy('r.id', 'ASC');
    const result = await this.page(qb, query);
    return { ...result, unfilteredTotal, items: result.items.map(r => roleResponse(r, locale)) };
  }

  async tables(query: ListQueryDto, user: User, locale?: string) {
    const qb = this.db.getRepository(DiningTable).createQueryBuilder('t').leftJoinAndSelect('t.sessions', 's', "s.status = 'open'");
    const raw = await qb.clone().select('COUNT(*)', 'total').addSelect('COUNT(s.id)', 'open').addSelect('COUNT(*) FILTER (WHERE t."isActive" AND s.id IS NULL)', 'available').addSelect('COUNT(*) FILTER (WHERE NOT t."isActive")', 'inactive').getRawOne();
    const stats = Object.fromEntries(Object.entries(raw).map(([k,v]) => [k, Number(v)]));
    if (query.search) qb.andWhere(`(t.number::text ILIKE :search OR ${textMatch('t."nameTranslations"', 't.name')})`, { search: literalSearch(query.search) });
    if (query.status === 'open') qb.andWhere('s.id IS NOT NULL');
    if (query.status === 'available') qb.andWhere('t.isActive = true AND s.id IS NULL');
    if (query.status === 'inactive') qb.andWhere('t.isActive = false');
    qb.orderBy('t.number', 'ASC').addOrderBy('t.id', 'ASC');
    const result = await this.page(qb, query);
    return { ...result, unfilteredTotal: stats.total, stats, items: result.items.map(table => { const { sessions, ...rest } = table; return { ...tableResponse(user, rest as DiningTable, locale), activeSession: sessions?.[0] ?? null }; }) };
  }
}
