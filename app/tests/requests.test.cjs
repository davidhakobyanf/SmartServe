const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Test the actual TS module in memory, without adding a browser/test framework.
const mod = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync(require.resolve('../src/lib/requestPool.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText)(mod, mod.exports);
const { RequestPool, coalesceRefresh, subscribeBeforeRead } = mod.exports;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return {promise,resolve,reject}; };

test('100 identical simultaneous reads share one request; completed data is not cached', async () => {
  const pool = new RequestPool(); const pending = deferred(); let calls = 0;
  const load = () => { calls++; return pending.promise; };
  const leases = Array.from({length:100}, () => pool.acquire('same-page', load));
  pending.resolve('page');
  assert.deepEqual(await Promise.all(leases.map(l => l.promise)), Array(100).fill('page'));
  leases.forEach(l => l.release()); assert.equal(calls,1);
  const next=pool.acquire('same-page',load); await next.promise; next.release(); assert.equal(calls,2);
});
test('different auth/session/locale/page identities never share data', async () => {
  const pool=new RequestPool(); let calls=0;
  const leases=['owner:am:1','owner:ru:1','guest1:am:1','guest2:am:1','owner:am:2'].map(key=>pool.acquire(key,async()=>{calls++;return key;}));
  assert.equal(new Set(await Promise.all(leases.map(l=>l.promise))).size,5); assert.equal(calls,5); leases.forEach(l=>l.release());
});
test('one consumer leaving does not cancel the other; last consumer cancels', async () => {
  const pool=new RequestPool(); let signal; const pending=deferred();
  const load=s=>{signal=s;return pending.promise;};
  const a=pool.acquire('q',load), b=pool.acquire('q',load); await pause(1);
  a.release(); a.release(); await pause(5); assert.equal(signal.aborted,false);
  b.release(); await pause(5); assert.equal(signal.aborted,true); pending.resolve(null); await b.promise;
});
test('same-tick remount reuses pending read without aborting', async () => {
  const pool=new RequestPool(); let calls=0, signal; const d=deferred(); const load=s=>{calls++;signal=s;return d.promise;};
  const first=pool.acquire('q',load); first.release(); const second=pool.acquire('q',load);
  await pause(5); assert.equal(calls,1); assert.equal(signal.aborted,false); d.resolve(1); await second.promise; second.release();
});
test('failed requests can retry and cannot poison future results', async () => {
  const pool=new RequestPool(); const a=pool.acquire('q',async()=>{throw Error('offline');});
  await assert.rejects(a.promise,/offline/); a.release();
  const b=pool.acquire('q',async()=>42); assert.equal(await b.promise,42); b.release();
});
test('100 socket events become one refresh; changes during it cause exactly one follow-up', async () => {
  const d=deferred(); let calls=0; const scheduler=coalesceRefresh(async()=>{calls++;if(calls===1)await d.promise;},5);
  for(let i=0;i<100;i++)scheduler.schedule(); await pause(15); assert.equal(calls,1);
  for(let i=0;i<100;i++)scheduler.schedule(); d.resolve(); await pause(20); assert.equal(calls,2); scheduler.dispose();
});
test('unmount cancels scheduled refreshes', async () => {
  let calls=0; const scheduler=coalesceRefresh(async()=>{calls++;},5); scheduler.schedule(); scheduler.dispose(); await pause(15); assert.equal(calls,0);
});
function fakeSocket(){ const listeners=new Map();return {on:(event,handler)=>listeners.set(event,handler),emit:event=>listeners.get(event)?.(),removeAllListeners:()=>listeners.clear(),disconnect:()=>{}}; }
test('subscribes before first read without duplicate loading; reconnect catches missed updates', async()=>{
  const socket=fakeSocket(); let ready=0,changed=0;
  const stop=subscribeBeforeRead(socket,()=>ready++,()=>changed++,20);
  assert.equal(ready,0); socket.emit('connect'); assert.equal(ready,1); assert.equal(changed,0);
  socket.emit('menu:updated'); socket.emit('connect'); assert.equal(ready,1); assert.equal(changed,2);
  stop(); await pause(25); assert.equal(ready,1);
});
test('HTTP remains usable without sockets; delayed connection triggers catch-up',async()=>{
  const socket=fakeSocket(); let ready=0,changed=0;
  const stop=subscribeBeforeRead(socket,()=>ready++,()=>changed++,5);
  await pause(15); assert.equal(ready,1); socket.emit('connect'); assert.equal(changed,1); stop();
});
