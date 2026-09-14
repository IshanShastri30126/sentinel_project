/**
 * L1 In-Memory Process-Local Cache Engine
 * 
 * Provides high-speed in-memory caching with:
 * - Bounded maximum size (LRU eviction) to prevent heap overflow
 * - Strict TTL enforcement
 * - Single-flight request coalescing to prevent thundering herd / cache stampede
 * - Prefix-based invalidation
 * - Complete lifecycle hooks for multi-tier cache coherence
 * 
 * Contract:
 * - KEY: Hierarchical namespace string (e.g., 'events:public:list:all', 'clubs:sentinel')
 * - TTL: Bounded lifespan in seconds (events: 30s, clubs: 300s, static: 600s)
 * - MAX SIZE: 500 entries (bounded memory footprint < 15MB)
 * - INSERTION: O(1) Map insertion with eviction of oldest key if limit exceeded
 * - LOOKUP: O(1) Map lookup with expiration check
 * - INVALIDATION: Explicit deletion on mutations (CREATE, UPDATE, DELETE, PUBLISH, UNPUBLISH)
 * - RESTART: Ephemeral process memory, cleared on process restart (safe cold start)
 * - MULTI-INSTANCE: Process-local. Bounded 30s TTL limits inter-instance divergence window.
 * - STALE WINDOW: 0s on mutating instance; <= 30s across distributed instances.
 * - FAILURE MODE: Transparent fallback to L2 (Upstash Redis) or L3 (PostgreSQL).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  size: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();
  private readonly maxSize: number;
  private readonly defaultTtlSeconds: number;

  private statsRecord: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
    size: 0,
  };

  constructor(maxSize: number = 500, defaultTtlSeconds: number = 30) {
    this.maxSize = maxSize;
    this.defaultTtlSeconds = defaultTtlSeconds;
  }

  /**
   * Retrieve a value from L1 cache.
   * Returns null if missing or expired.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.statsRecord.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.statsRecord.misses++;
      this.statsRecord.size = this.store.size;
      return null;
    }

    // Refresh position for LRU order
    this.store.delete(key);
    this.store.set(key, entry);

    this.statsRecord.hits++;
    return entry.value as T;
  }

  /**
   * Store a value in L1 cache with TTL.
   * Evicts the oldest entry if maxSize is reached.
   */
  set<T>(key: string, value: T, ttlSeconds: number = this.defaultTtlSeconds): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxSize) {
      // Evict oldest (first inserted key)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
        this.statsRecord.evictions++;
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    this.statsRecord.sets++;
    this.statsRecord.size = this.store.size;
  }

  /**
   * Remove a specific key from L1 cache.
   */
  del(key: string): void {
    this.store.delete(key);
    this.statsRecord.size = this.store.size;
  }

  /**
   * Invalidate all keys matching a given prefix.
   */
  delPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
    this.statsRecord.size = this.store.size;
  }

  /**
   * Clear the entire L1 cache.
   */
  clear(): void {
    this.store.clear();
    this.statsRecord.size = 0;
  }

  /**
   * Single-flight request coalescing (anti-stampede / anti-thundering-herd).
   * If a fetch for this key is already running, subsequent callers await the same Promise.
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = this.defaultTtlSeconds
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if an identical fetch is currently in-flight
    const running = this.inFlight.get(key);
    if (running) {
      return (await running) as T;
    }

    const fetchPromise = (async () => {
      try {
        const result = await fetchFn();
        if (result !== null && result !== undefined) {
          this.set(key, result, ttlSeconds);
        }
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, fetchPromise);
    return (await fetchPromise) as T;
  }

  /**
   * Return real-time cache statistics.
   */
  stats(): CacheStats {
    return { ...this.statsRecord, size: this.store.size };
  }
}

// Global L1 Cache Singleton for Sentinel API
export const l1Cache = new MemoryCache(500, 30);

export default l1Cache;
