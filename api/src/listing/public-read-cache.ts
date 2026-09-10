// Only public menu projections may use this cache; never staff, sessions,
// baskets, orders or permissions. TTL is a fallback; domain events clear it.
export class PublicReadCache {
  private entries = new Map<string, { expires: number; value: Promise<unknown> }>();
  constructor(private readonly capacity = 64, private readonly ttlMs = 2000) {}
  get<T>(key: string, read: () => Promise<T>): Promise<T> {
    const existing = this.entries.get(key);
    if (existing && existing.expires > Date.now()) return existing.value as Promise<T>;
    this.entries.delete(key);
    while (this.entries.size >= this.capacity) this.entries.delete(this.entries.keys().next().value!);
    const entry = { expires: Date.now() + this.ttlMs, value: Promise.resolve().then(read) };
    this.entries.set(key, entry);
    void entry.value.catch(() => { if (this.entries.get(key) === entry) this.entries.delete(key); });
    return entry.value;
  }
  clear() { this.entries.clear(); }
}
