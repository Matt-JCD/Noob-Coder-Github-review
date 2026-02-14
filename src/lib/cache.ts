interface CacheEntry<T> {
  value: T;
  expiry: number;
}

const TTL = 30 * 60 * 1000; // 30 minutes
const MAX_ENTRIES = 5000;

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    // Evict oldest if at capacity
    if (this.cache.size >= MAX_ENTRIES) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, expiry: Date.now() + TTL });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}

// Explanation cache: key is "owner/repo:folderPath:itemName"
export const explanationCache = new LRUCache<string>();

// File detail cache: key is "owner/repo:filePath"
export const fileDetailCache = new LRUCache<object>();
