import { randomUUID } from 'crypto';
import { performance } from 'perf_hooks';
import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../app.module';
import { ENTITIES } from '../database/entities';
import { AddListingIndexes1788930000000 } from '../migrations/1788930000000-AddListingIndexes';
// Reuse the installed frontend client; no new runtime dependency for the API.
const { io } = require('../../../app/node_modules/socket.io-client');

const loadTest = process.env.RUN_PERFORMANCE_TESTS === 'true' ? describe : describe.skip;
loadTest('Local performance and concurrent correctness', () => {
  const schema = `performance_test_${randomUUID().replace(/-/g, '')}`;
  let bootstrap: DataSource, db: DataSource, app: INestApplication, base: string, jwt: string;
  let sessions: Array<{id: string; tableId: string}>;
  let productId: string;
  const sockets: Array<ReturnType<typeof io>> = [];
  const metrics: Record<string, unknown> = {};
  beforeAll(async () => {
    const host = process.env.LISTING_TEST_DB_HOST;
    if (!host || !(host.startsWith('/private/tmp/') || host === '127.0.0.1' || host === 'localhost')) throw new Error('Performance tests require an explicitly configured LOCAL disposable PostgreSQL');
    const connection = { type: 'postgres' as const, host, port: Number(process.env.LISTING_TEST_DB_PORT ?? 55439), username: process.env.LISTING_TEST_DB_USER, password: process.env.LISTING_TEST_DB_PASSWORD, database: process.env.LISTING_TEST_DB_NAME ?? 'postgres' };
    bootstrap = await new DataSource(connection).initialize();
    await bootstrap.query(`CREATE SCHEMA "${schema}"`);
    db = await new DataSource({ ...connection, schema, entities: ENTITIES, synchronize: true, extra: { max: 10, options: `-c search_path=${schema},public` } }).initialize();
    const runner = db.createQueryRunner();
    await db.query(`CREATE FUNCTION test_uuid(value text) RETURNS uuid LANGUAGE SQL IMMUTABLE AS $$ SELECT (substr(md5(value),1,12)||'4'||substr(md5(value),14,3)||'a'||substr(md5(value),18,15))::uuid $$`);
    try { await new AddListingIndexes1788930000000().up(runner); } finally { await runner.release(); }
    await db.query(`INSERT INTO roles (id,name,code,permissions) VALUES (test_uuid('owner')::uuid,'Test owner','owner','[]')`);
    await db.query(`INSERT INTO users (id,name,surname,email,password,"roleId",status) SELECT test_uuid('u'||i)::uuid,'Staff '||i,'Test','staff'||i||'@perf.test','not-a-real-password',test_uuid('owner')::uuid,'active' FROM generate_series(1,1000) i`);
    await db.query(`INSERT INTO categories (id,name,"nameTranslations") SELECT test_uuid('c'||i)::uuid,'Category '||i,jsonb_build_object('en','Category '||i,'am','Կատեգորիա '||i,'ru','Категория '||i) FROM generate_series(1,100) i`);
    await db.query(`INSERT INTO sauces (id,name,price,"nameTranslations") SELECT test_uuid('s'||i)::uuid,'Sauce '||i,100,jsonb_build_object('en','Sauce '||i,'am','Սոուս '||i,'ru','Соус '||i) FROM generate_series(1,100) i`);
    await db.query(`INSERT INTO products (id,"categoryId",title,"titleTranslations",description,price) SELECT test_uuid('p'||i)::uuid,test_uuid('c'||(1+i%100))::uuid,'Dish '||i,jsonb_build_object('en','Dish '||i,'am','Ապուր '||i,'ru','Суп '||i),repeat('Description ',20),1000+i FROM generate_series(1,2000) i`);
    await db.query(`INSERT INTO product_sauces ("productId","sauceId") SELECT test_uuid('p'||i)::uuid,test_uuid('s'||j)::uuid FROM generate_series(1,2000) i CROSS JOIN generate_series(1,3) j`);
    await db.query(`INSERT INTO tables (id,number,"publicToken",name) SELECT test_uuid('t'||i)::uuid,i,test_uuid('qr'||i)::uuid,'Table '||i FROM generate_series(1,1000) i`);
    await db.query(`INSERT INTO dining_sessions (id,"tableId",status) SELECT test_uuid('visit'||i)::uuid,test_uuid('t'||i)::uuid,'open' FROM generate_series(1,1000) i`);
    await db.query(`INSERT INTO orders (id,"tableId","sessionId",status,total,"createdAt") SELECT test_uuid('o'||i)::uuid,test_uuid('t'||(1+i%1000))::uuid,test_uuid('visit'||(1+i%1000))::uuid,(ARRAY['placed','preparing','ready','completed','cancelled'])[1+i%5]::order_status_enum,3000,now()-i*interval '1 second' FROM generate_series(1,6000) i`);
    await db.query(`INSERT INTO order_items (id,"orderId","productId","titleSnapshot","titleTranslationsSnapshot","unitPrice",quantity,"lineTotal",sauces) SELECT test_uuid('line'||i||'-'||j)::uuid,test_uuid('o'||i)::uuid,test_uuid('p'||(1+i%2000))::uuid,'Soup '||i,jsonb_build_object('en','Soup '||i,'am','Ապուր '||i,'ru','Суп '||i),1000,1,1000,'[{"name":"Garlic","nameTranslations":{"ru":"Чесночный","am":"Սխտորի"},"unitPrice":100}]'::jsonb FROM generate_series(1,6000) i CROSS JOIN generate_series(1,3) j`);
    await db.query('ANALYZE');
    sessions = await db.query('SELECT id,"tableId" FROM dining_sessions ORDER BY id');
    productId = (await db.query('SELECT id FROM products LIMIT 1'))[0].id;
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(DataSource).useValue(db).compile();
    app = module.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.listen(0, '127.0.0.1'); base = await app.getUrl();
    jwt = app.get(JwtService).sign({sub: (await db.query('SELECT id FROM users LIMIT 1'))[0].id});
  }, 60000);

  afterAll(async () => {
    sockets.forEach(socket => socket.disconnect());
    console.log('PERFORMANCE_RESULTS', JSON.stringify(metrics));
    if (app) await app.close();
    if (db?.isInitialized) await db.destroy();
    if (bootstrap?.isInitialized) { await bootstrap.query(`DROP SCHEMA "${schema}" CASCADE`); await bootstrap.destroy(); }
  });
  async function request(path: string, guest?: string, body?: unknown, method = 'GET') {
    const res = await fetch(`${base}/api/${path}`, { method, signal: AbortSignal.timeout(15000), headers: { ...(guest ? {'x-session-token': guest} : {Authorization: `Bearer ${jwt}`}), 'Content-Type':'application/json', 'Accept-Language':'am' }, ...(body !== undefined ? {body:JSON.stringify(body)} : {}) });
    const text = await res.text(); return {status: res.status, data: JSON.parse(text), bytes: Buffer.byteLength(text)};
  }
  async function parallel(count: number, concurrency: number, action: (index:number)=>Promise<void>) {
    let next=0;
    const results=await Promise.allSettled(Array.from({length:concurrency}, async()=>{ while(next<count){ const i=next++; try { await action(i); } catch(error) { next=count; throw error; } } }));
    const failed=results.find(result=>result.status==='rejected');
    if(failed?.status==='rejected')throw failed.reason;
  }
  const percentile = (values:number[], fraction:number) => Math.round([...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*fraction))]);

  it('bounds payloads and deep pages with 2000 products / 6000 orders / 1000 staff and tables', async () => {
    for (const [resource,total] of [['products',2000],['orders',6000],['users',1000],['tables',1000]] as const) {
      const page=await request(`lists/${resource}?page=20&pageSize=24`);
      expect(page.status).toBe(200); expect(page.data.total).toBe(total); expect(page.data.items).toHaveLength(24);
      expect(page.bytes).toBeLessThan(150000);
      metrics[`${resource}PageBytes`]=page.bytes;
    }
    const page=await request('lists/products?page=84&pageSize=24'); expect(page.data.items).toHaveLength(8);
    expect((await request('lists/orders?status=active&pageSize=12')).data.total).toBe(3600);
  });
  it.each([10,50,100,1000])('measures 1000 mixed HTTP reads with concurrency %i', async concurrency => {
    const durations:number[]=[]; let bytes=0, errors=0;
    const started=performance.now();
    await parallel(1000,concurrency,async i=>{
      const start=performance.now();
      const guest=i%2===0?sessions[i%1000].id:undefined;
      const resource=i%5===0?'orders':'products';
      const search=i%3===0?'&search='+encodeURIComponent(resource==='orders'?'СУП':'ԱՊՈՒՐ'):'';
      const response=await request(`${guest?'guest-lists':'lists'}/${resource}?pageSize=24&page=${resource==='orders'?1:1+i%50}${search}`,guest);
      durations.push(performance.now()-start); bytes+=response.bytes;
      if(response.status!==200)errors++;
      expect(response.status).toBe(200); expect(response.data.items.length).toBeLessThanOrEqual(24);
      if(guest&&resource==='orders') expect(response.data.items.every((o:{sessionId:string})=>o.sessionId===guest)).toBe(true);
    });
    const seconds=(performance.now()-started)/1000;
    metrics[`httpConcurrency${concurrency}`]={requests:1000,errors,seconds:+seconds.toFixed(2),rps:Math.round(1000/seconds),p50ms:percentile(durations,.5),p95ms:percentile(durations,.95),maxMs:Math.round(Math.max(...durations)),bytes};
    console.log('HTTP_LOAD',JSON.stringify(metrics[`httpConcurrency${concurrency}`]));
    expect(errors).toBe(0);
  }, 180000);
  it('accepts only one order for 20 concurrent submissions of the same basket', async () => {
    const session=sessions[0];
    await db.query('INSERT INTO basket_items ("sessionId","productId",quantity,"unitPrice") VALUES ($1,$2,1,1000)',[session.id,productId]);
    const before=Number((await db.query('SELECT COUNT(*) n FROM orders WHERE "sessionId"=$1',[session.id]))[0].n);
    const results=await Promise.all(Array.from({length:20},()=>request('orders',session.id,{},'POST')));
    expect(results.filter(r=>r.status===201)).toHaveLength(1); expect(results.filter(r=>r.status===400)).toHaveLength(19);
    expect(Number((await db.query('SELECT COUNT(*) n FROM orders WHERE "sessionId"=$1',[session.id]))[0].n)).toBe(before+1);
  });
  it('preserves all 20 concurrent additions to the same basket line', async () => {
    const token=sessions[1].id;
    const results=await Promise.all(Array.from({length:20},()=>request('basket-items',token,{productId,quantity:1},'POST')));
    expect(results.every(r=>r.status===201)).toBe(true);
    const basket=await request('basket-items',token);
    expect(basket.data).toHaveLength(1);
    expect(basket.data[0].quantity).toBe(20);
  });
  it('places orders for 1000 distinct clients with 25 concurrent writers', async () => {
    await db.query('INSERT INTO basket_items ("sessionId","productId",quantity,"unitPrice") SELECT id,$1,1,1000 FROM dining_sessions',[productId]);
    const before=Number((await db.query('SELECT COUNT(*) n FROM orders'))[0].n);
    const ids=new Set<string>(); const durations:number[]=[]; const start=performance.now();
    await parallel(1000,25,async i=>{
      const begin=performance.now(); const result=await request('orders',sessions[i].id,{},'POST');
      expect(result.status).toBe(201); expect(result.data.sessionId).toBe(sessions[i].id); ids.add(result.data.id); durations.push(performance.now()-begin);
    });
    expect(ids.size).toBe(1000);
    expect(Number((await db.query('SELECT COUNT(*) n FROM orders'))[0].n)).toBe(before+1000);
    expect(Number((await db.query('SELECT COUNT(*) n FROM basket_items'))[0].n)).toBe(0);
    metrics.orderWrites={clients:1000,concurrency:25,seconds:+((performance.now()-start)/1000).toFixed(2),p95ms:percentile(durations,.95)};
  },180000);
  it('joins 1000 independent guest sockets and delivers a ready event only to its session', async () => {
    const started=performance.now(); const received:string[]=[];
    await parallel(1000,25,async i=>{
      const socket=io(`${base}/sessions`,{transports:['websocket'],forceNew:true,reconnection:false}); sockets.push(socket);
      socket.on('order:changed',()=>received.push(sessions[i].id));
      await new Promise<void>((resolve,reject)=>{
        const timer=setTimeout(()=>reject(Error('socket join timeout')),15000);
        socket.once('connect_error',(e:Error)=>{clearTimeout(timer);reject(e);});
        socket.once('connect',()=>socket.emit('join',{token:sessions[i].id},(ack:{ok:boolean})=>{clearTimeout(timer);ack.ok?resolve():reject(Error('join rejected'));}));
      });
    });
    metrics.socketJoin={clients:1000,seconds:+((performance.now()-started)/1000).toFixed(2),rssMB:Math.round(process.memoryUsage().rss/1024/1024)};
    const order=(await db.query('SELECT id FROM orders WHERE "sessionId"=$1 LIMIT 1',[sessions[0].id]))[0];
    const ready=await request(`orders/${order.id}/status`,undefined,{status:'ready'},'PATCH'); expect(ready.status).toBe(200);
    await new Promise(resolve=>setTimeout(resolve,200));
    expect(received).toEqual([sessions[0].id]);
    // Keep all sockets open while clients concurrently request pages.
    const activeStarted=performance.now();
    await parallel(1000,1000,async i=>{expect((await request('guest-lists/products?pageSize=12',sessions[i].id)).status).toBe(200);});
    metrics.socketHttpBurst={clients:1000,requests:1000,concurrency:1000,seconds:+((performance.now()-activeStarted)/1000).toFixed(2)};
    expect(sockets.every(s=>s.connected)).toBe(true);
  }, 180000);
});
