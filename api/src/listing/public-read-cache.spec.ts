import { PublicReadCache } from './public-read-cache';

describe('Bounded public menu cache', () => {
  afterEach(() => jest.useRealTimers());
  it('coalesces 1000 concurrent reads without sharing different queries/locales', async () => {
    const cache=new PublicReadCache(); const read=jest.fn(async()=>({items:[]}));
    await Promise.all(Array.from({length:1000},()=>cache.get('am:page1',read)));
    expect(read).toHaveBeenCalledTimes(1);
    await cache.get('ru:page1',read); expect(read).toHaveBeenCalledTimes(2);
  });
  it('expires, bounds memory and retries failures', async () => {
    jest.useFakeTimers(); const cache=new PublicReadCache(2,100); const read=jest.fn(async()=>1);
    await cache.get('a',read); await cache.get('b',read); await cache.get('c',read); await cache.get('a',read);
    expect(read).toHaveBeenCalledTimes(4);
    jest.advanceTimersByTime(101); await cache.get('a',read); expect(read).toHaveBeenCalledTimes(5);
    await expect(cache.get('bad',async()=>{throw Error('db');})).rejects.toThrow('db');
    expect(await cache.get('bad',read)).toBe(1);
  });
  it('an invalidated pending query cannot repopulate stale cache', async () => {
    const cache=new PublicReadCache(); let finish!:(v:number)=>void;
    const old=cache.get('a',()=>new Promise<number>(resolve=>{finish=resolve;}));
    await Promise.resolve(); cache.clear();
    expect(await cache.get('a',async()=>2)).toBe(2); finish(1); await old;
    expect(await cache.get('a',async()=>3)).toBe(2);
  });
});
