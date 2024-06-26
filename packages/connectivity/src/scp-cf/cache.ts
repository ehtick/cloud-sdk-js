interface CacheInterface<T> {
  hasKey(key: string): boolean;
  get(key: string | undefined): T | undefined;
  set(key: string | undefined, item: CacheEntry<T>): void;
  clear(): void;
}

/**
 * Representation of a cached object.
 */
export interface CacheEntry<T> {
  /**
   * The expiration time of the cache entry in milliseconds.
   */
  expires?: number;
  /**
   * The cache entry.
   */
  entry: T;
}

/**
 * Options to enable caching when fetching destinations.
 */
export interface CachingOptions {
  /**
   * A boolean value that indicates whether to read destinations from cache.
   */
  useCache?: boolean;
}

/**
 * Representation of a cache to transiently store objects locally for faster access.
 * @typeParam T - Type of the cache entries.
 * @internal
 */
export class Cache<T> implements CacheInterface<T> {
  /**
   * Object that stores all cached entries.
   */
  private cache: Record<string, CacheEntry<T>>;

  /**
   * Creates an instance of Cache.
   * @param defaultValidityTime - The default validity time in milliseconds. Use 0 for unlimited cache duration.
   */
  constructor(private defaultValidityTime: number) {
    this.cache = {};
  }

  /**
   * Clear all cached items.
   */
  clear(): void {
    this.cache = {};
  }

  /**
   * Specifies whether an entry with a given key is defined in cache.
   * @param key - The entry's key.
   * @returns A boolean value that indicates whether the entry exists in cache.
   */
  hasKey(key: string): boolean {
    return this.cache.hasOwnProperty(key);
  }

  /**
   * Getter of cached entries.
   * @param key - The key of the entry to retrieve.
   * @returns The corresponding entry to the provided key if it is still valid, returns `undefined` otherwise.
   */
  get(key: string | undefined): T | undefined {
    return key && this.hasKey(key) && !isExpired(this.cache[key])
      ? this.cache[key].entry
      : undefined;
  }

  /**
   * Setter of entries in cache.
   * @param key - The entry's key.
   * @param item - The entry to cache.
   */
  set(key: string | undefined, item: CacheEntry<T>): void {
    if (key) {
      const expires = item.expires ?? this.inferDefaultExpirationTime();
      this.cache[key] = { entry: item.entry, expires };
    }
  }

  private inferDefaultExpirationTime(): number | undefined {
    const now = new Date();
    return this.defaultValidityTime
      ? now
          .setMilliseconds(now.getMilliseconds() + this.defaultValidityTime)
          .valueOf()
      : undefined;
  }
}

function isExpired<T>(item: CacheEntry<T>): boolean {
  if (item.expires === undefined) {
    return false;
  }
  return item.expires < Date.now();
}
