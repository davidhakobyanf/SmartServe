import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../app.module';
import { ENTITIES } from '../database/entities';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { Sauce } from '../entities/sauce.entity';
import { ProductSauce } from '../entities/product-sauce.entity';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { UserStatus } from '../common/auth/user-status';
import { Permission } from '../common/auth/permission';
import { DiningTable } from '../entities/dining-table.entity';
import { DiningSession } from '../entities/dining-session.entity';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { SaucesService } from '../sauces/sauces.service';
import { SessionsService } from '../sessions/sessions.service';

// Explicit opt-in only. Each run owns an isolated random schema and removes
// only that schema; no fixtures or migrations touch the developer's tables.
const integration = process.env.LISTING_TEST_DB_HOST ? describe : describe.skip;
integration('Paginated read models on PostgreSQL', () => {
  const schema = `listing_test_${randomUUID().replace(/-/g, '')}`;
  let bootstrap: DataSource;
  let db: DataSource;
  let app: INestApplication;
  let base: string;
  let ownerToken: string;
  let viewerToken: string;
  let category: Category;
  let hiddenCategory: Category;
  let sauce: Sauce;
  let secondSauce: Sauce;
  let inactiveSauce: Sauce;
  let target: Product;
  let ownSession: DiningSession;
  let otherSession: DiningSession;

  beforeAll(async () => {
    const connection = {
      type: 'postgres' as const, host: process.env.LISTING_TEST_DB_HOST,
      port: Number(process.env.LISTING_TEST_DB_PORT ?? 5432),
      username: process.env.LISTING_TEST_DB_USER ?? 'smartserve',
      password: process.env.LISTING_TEST_DB_PASSWORD,
      database: process.env.LISTING_TEST_DB_NAME ?? 'postgres',
    };
    bootstrap = await new DataSource(connection).initialize();
    await bootstrap.query(`CREATE SCHEMA "${schema}"`);
    db = await new DataSource({ ...connection, schema, entities: ENTITIES, synchronize: true, extra: { options: `-c search_path=${schema},public` } }).initialize();
    category = await db.getRepository(Category).save({ name: 'Food', nameTranslations: { en: 'Food', am: 'Ուտեստներ', ru: 'Еда' } });
    hiddenCategory = await db.getRepository(Category).save({ name: 'Hidden', isActive: false });
    for (let i = 0; i < 26; i++) await db.getRepository(Category).save({ name: `Category ${String(i).padStart(2, '0')}` });
    sauce = await db.getRepository(Sauce).save({ name: 'Garlic', price: 100, nameTranslations: { ru: 'Чесночный', am: 'Սխտորի' } });
    secondSauce = await db.getRepository(Sauce).save({ name: 'Chili', price: 200 });
    inactiveSauce = await db.getRepository(Sauce).save({ name: 'Hidden sauce', price: 300, isActive: false });
    for (let i = 0; i < 27; i++) {
      const product = await db.getRepository(Product).save({ categoryId: category.id, title: `Dish ${String(i).padStart(2, '0')}`, price: 100 + Math.floor(i / 2), stockQuantity: null });
      if (i === 26) target = product;
    }
    await db.getRepository(Product).update(target.id, { title: 'Soup 100%_special', titleTranslations: { en: 'Soup 100%_special', ru: 'Грибной суп', am: 'Սնկով ապուր' } });
    target = await db.getRepository(Product).findOneByOrFail({ id: target.id });
    for (const s of [sauce, secondSauce, inactiveSauce]) await db.getRepository(ProductSauce).save({ productId: target.id, sauceId: s.id });
    await db.getRepository(Product).save({ categoryId: hiddenCategory.id, title: 'Hidden product', price: 1 });
    await db.getRepository(Product).save({ categoryId: category.id, title: 'Unavailable product', isActive: false, price: 1 });
    const ownerRole = await db.getRepository(Role).save({ name: 'Owner', code: 'owner', permissions: [] });
    const viewerRole = await db.getRepository(Role).save({ name: 'Kitchen', code: 'kitchen', permissions: [Permission.ORDERS_VIEW, Permission.TABLES_VIEW, Permission.MENU_VIEW] });
    const owner = await db.getRepository(User).save({ name: 'Owner', surname: 'Test', email: 'owner@listing.test', password: 'never-return', roleId: ownerRole.id, status: UserStatus.ACTIVE });
    const viewer = await db.getRepository(User).save({ name: 'Արամ', surname: 'Кухня', email: 'viewer@listing.test', password: 'never-return', roleId: viewerRole.id, status: UserStatus.ACTIVE });
    const table = await db.getRepository(DiningTable).save({ number: 1, publicToken: randomUUID(), name: 'Окно', nameTranslations: { am: 'Պատուհան' } });
    const otherTable = await db.getRepository(DiningTable).save({ number: 2, publicToken: randomUUID() });
    await db.getRepository(DiningTable).save({ number: 3, publicToken: randomUUID(), isActive: false });
    ownSession = await db.getRepository(DiningSession).save({ tableId: table.id, status: 'open' });
    otherSession = await db.getRepository(DiningSession).save({ tableId: otherTable.id, status: 'open' });
    for (const [i, status] of (['placed', 'completed', 'ready'] as const).entries()) {
      const session = i === 2 ? otherSession : ownSession;
      const order = await db.getRepository(Order).save({ tableId: session.tableId, sessionId: session.id, status, total: 3000, createdAt: new Date(1700000000000 + i * 1000) });
      await db.getRepository(OrderItem).save({ orderId: order.id, productId: target.id, titleSnapshot: target.title, titleTranslationsSnapshot: target.titleTranslations, unitPrice: 1000, quantity: 3, lineTotal: 3000, sauces: [{ id: sauce.id, name: sauce.name, nameTranslations: sauce.nameTranslations, unitPrice: 100 }] });
    }
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(DataSource).useValue(db).compile();
    app = module.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
    const jwt = app.get(JwtService);
    ownerToken = jwt.sign({ sub: owner.id }); viewerToken = jwt.sign({ sub: viewer.id });
  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
    if (db?.isInitialized) await db.destroy();
    if (bootstrap?.isInitialized) { await bootstrap.query(`DROP SCHEMA "${schema}" CASCADE`); await bootstrap.destroy(); }
  });

  async function get(resource: string, query: Record<string, string | number> = {}, token = ownerToken, guest = false) {
    const params = new URLSearchParams(Object.entries(query).map(([k,v]) => [k, String(v)]));
    const response = await fetch(`${base}/api/${guest ? 'guest-lists' : 'lists'}/${resource}?${params}`, {
      headers: { ...(guest ? { 'x-session-token': token } : { Authorization: `Bearer ${token}` }), 'Accept-Language': 'am' },
    });
    return { status: response.status, body: await response.json() };
  }

  it('limits data in SQL, returns totals, and keeps pages disjoint with tied sort values', async () => {
    const first = await get('products', { page: 1, pageSize: 12, sort: 'price-asc' });
    const second = await get('products', { page: 2, pageSize: 12, sort: 'price-asc' });
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ total: 29, page: 1, pageSize: 12, totalPages: 3 });
    expect(first.body.items).toHaveLength(12);
    expect(second.body.items).toHaveLength(12);
    expect(new Set([...first.body.items, ...second.body.items].map(p => p.id)).size).toBe(24);
  });
  it.each(['СУП', 'суп', 'ԱՊՈՒՐ', 'ապուր', '100%_'])('searches all menu translations and treats wildcards literally: %s', async search => {
    const result = await get('products', { search });
    expect(result.status).toBe(200);
    expect(result.body.total).toBe(1);
    expect(result.body.items[0].id).toBe(target.id);
  });
  it('combines category and sauce predicates without losing sauce relations or duplicating rows', async () => {
    const result = await get('products', { categoryId: category.id, sauceId: sauce.id, pageSize: 1 });
    expect(result.body.total).toBe(1);
    expect(result.body.items[0].sauces).toHaveLength(3);
    expect((await get('products', { categoryId: hiddenCategory.id, sauceId: sauce.id })).body.total).toBe(0);
  });
  it('hides inactive categories and sauces from guests, preserving unavailable dishes at the end', async () => {
    const result = await get('products', { pageSize: 100, sort: 'price-asc' }, ownSession.id, true);
    expect(result.body.total).toBe(28);
    expect(result.body.items.at(-1).title).toBe('Unavailable product');
    expect(result.body.items.find((p: Product) => p.id === target.id).sauces).toHaveLength(2);
    expect((await get('products', { sauceId: inactiveSauce.id }, ownSession.id, true)).body.total).toBe(0);
    expect((await get('categories', {}, ownSession.id, true)).body.total).toBe(1);
  });
  it('paginates and searches category and sauce options independently from products', async () => {
    expect((await get('categories', { page: 2, pageSize: 24 })).body.items).toHaveLength(4);
    expect((await get('categories', { search: 'Category 25' })).body.total).toBe(1);
    expect((await get('sauces', { search: 'СХТОРИ' })).body.total).toBe(0);
    expect((await get('sauces', { search: 'ՍԽՏՈՐԻ', isActive: 'true' })).body.total).toBe(1);
  });
  it('clamps a missing final page and returns empty results correctly', async () => {
    expect((await get('products', { page: 9999, pageSize: 12 })).body).toMatchObject({ page: 3, total: 29 });
    expect((await get('products', { page: 99, search: 'no such dish' })).body).toMatchObject({ items: [], page: 1, total: 0, totalPages: 0 });
  });
  it('filters orders in SQL and calculates statistics across the whole set', async () => {
    const result = await get('orders', { status: 'active', pageSize: 1, search: 'СУП' });
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ total: 2, stats: { total: 3, items: 9, tables: 2, revenue: 3000 }, filterCounts: { active: 2, history: 1 } });
    expect(result.body.items).toHaveLength(1);
    expect((await get('orders', { search: 'ՍԽՏՈՐԻ' })).body.total).toBe(3);
    expect((await get('orders', { status: 'history' })).body.items[0].status).toBe('completed');
  });
  it('scopes guest order pages to the authenticated dining session, ignoring forged query scope', async () => {
    const result = await get('orders', { sessionId: otherSession.id, pageSize: 1 }, ownSession.id, true);
    expect(result.body.total).toBe(2);
    expect(result.body.items.every((o: Order) => o.sessionId === ownSession.id)).toBe(true);
    expect((await get('orders', {}, otherSession.id, true)).body.total).toBe(1);
  });
  it('preserves permissions and strips revenue, passwords and QR tokens', async () => {
    const orders = await get('orders', {}, viewerToken);
    expect(orders.body.stats.revenue).toBeUndefined();
    expect(orders.body.items[0].total).toBeNull();
    expect((await get('tables', {}, viewerToken)).body.items[0].publicToken).toBeUndefined();
    expect((await get('users', {}, viewerToken)).status).toBe(403);
    expect((await get('users')).body.items.every((u: Record<string, unknown>) => !('password' in u))).toBe(true);
    expect((await get('products', {}, 'bad')).status).toBe(401);
    expect((await get('products', {}, randomUUID(), true)).status).toBe(404);
  });
  it('searches and paginates staff, roles and tables with global counts', async () => {
    expect((await get('users', { search: 'ԱՐԱՄ', pageSize: 1 })).body).toMatchObject({ total: 1, stats: { total: 2, active: 2 } });
    expect((await get('roles', { search: 'kitchen' })).body.total).toBe(1);
    expect((await get('tables', { search: 'ПАТУՀАН' })).body.total).toBe(0);
    expect((await get('tables', { search: 'ՊԱՏՈՒՀԱՆ' })).body.total).toBe(1);
    expect((await get('tables', { status: 'open', pageSize: 1 })).body).toMatchObject({ total: 2, stats: { total: 3, open: 2, available: 0, inactive: 1 } });
  });
  it.each<Record<string, string | number>>([{page: 0}, {pageSize: 101}, {sort: 'DROP TABLE'}, {categoryId: 'invalid'}])('rejects invalid HTTP parameters %j', async query => {
    expect((await get('products', query)).status).toBe(400);
  });
  it('invalidates cached public projections on product/category/sauce writes', async () => {
    await get('products', { id: target.id }, ownSession.id, true);
    await app.get(ProductsService).update(target.id, {titleTranslations:{en:'Updated soup',am:'Նոր ապուր',ru:'Новый суп'}});
    expect((await get('products',{id:target.id},ownSession.id,true)).body.items[0].title).toBe('Նոր ապուր');
    await get('products',{sauceId:sauce.id},ownSession.id,true);
    await app.get(SaucesService).update(sauce.id,{isActive:false});
    expect((await get('products',{sauceId:sauce.id},ownSession.id,true)).body.total).toBe(0);
    await app.get(CategoriesService).update(category.id,{isActive:false});
    expect((await get('products',{id:target.id},ownSession.id,true)).body.total).toBe(0);
  });
  it('checks session authorization even when a public page is already cached', async () => {
    await get('products',{},ownSession.id,true);
    await app.get(SessionsService).close(ownSession.id);
    expect((await get('products',{},ownSession.id,true)).status).toBe(403);
    expect((await get('products',{},otherSession.id,true)).status).toBe(200);
  });
});
