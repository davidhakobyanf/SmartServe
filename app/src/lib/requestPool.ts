// Share only pending GETs, never completed private data. Callers include auth,
// guest session, language and filters in the key. The pool cannot grow as users
// browse thousands of pages; entries leave on completion or final unsubscribe.
type Entry<T> = { promise: Promise<T>; controller: AbortController; users: number; cleanup?: ReturnType<typeof setTimeout> };
export class RequestPool {
  private entries = new Map<string, Entry<unknown>>();
  acquire<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
    let entry = this.entries.get(key) as Entry<T> | undefined;
    if (!entry) {
      const controller = new AbortController();
      const created: Entry<T> = { controller, users: 0, promise: Promise.resolve().then(() => load(controller.signal)) };
      entry = created;
      this.entries.set(key, created);
      const settle = () => { if (this.entries.get(key) === created) this.entries.delete(key); };
      void created.promise.then(settle, settle);
    }
    if (entry.cleanup) clearTimeout(entry.cleanup);
    entry.users++;
    let released = false;
    const current = entry;
    return { promise: current.promise, release: () => {
      if (released) return;
      released = true;
      if (--current.users === 0) current.cleanup = setTimeout(() => {
        if (current.users === 0 && this.entries.get(key) === current) {
          this.entries.delete(key);
          current.controller.abort();
        }
      }, 0); // Allow React effect cleanup/re-subscribe in the same tick.
    } };
  }
}

// A fixed window, not a trailing debounce: continuous events cannot postpone
// refreshing indefinitely. Events during a refresh schedule one more window.
export function coalesceRefresh(run: () => Promise<void>, delay = 400) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let dirty = false;
  let disposed = false;
  const schedule = () => {
    if (disposed) return;
    dirty = true;
    if (timer || running) return;
    timer = setTimeout(async () => {
      timer = undefined;
      dirty = false;
      running = true;
      try { await run(); } finally {
        running = false;
        if (dirty) schedule();
      }
    }, delay);
  };
  return { schedule, dispose: () => { disposed = true; if (timer) clearTimeout(timer); } };
}

export function subscribeBeforeRead(
  socket: {on: (event:string, handler:()=>void)=>unknown; removeAllListeners:()=>unknown; disconnect:()=>unknown},
  ready: () => void, changed: () => void, timeoutMs = 1500,
) {
  let bootstrapped = false;
  const fallback = setTimeout(() => { bootstrapped = true; ready(); }, timeoutMs);
  socket.on('connect', () => {
    clearTimeout(fallback);
    if (bootstrapped) changed();
    else ready();
    bootstrapped = true;
  });
  socket.on('menu:updated', changed);
  return () => { clearTimeout(fallback); socket.removeAllListeners(); socket.disconnect(); };
}
