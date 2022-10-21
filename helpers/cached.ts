export interface CacheEntry<Item> {
  item: Item;
  maxAge: number;
  validUntil: number;
  key: string;
}

export class Cached<Item, Opts> {
  private getItemOnMiss: (opts: Opts) => Promise<Item>;
  private calculateExpiration: (key: string, newItem: Item) => Promise<number>;
  private shouldLog: boolean;
  private logPrefix: string;

  private cacheEntries = new Map<string, CacheEntry<Item>>();

  private get nowTimeInSeconds(): number {
    return Math.ceil(new Date().getTime() / 1_000);
  }

  constructor(
    getItemOnMiss: (opts: Opts) => Promise<Item>,
    calculateExpiration: (key: string, newItem: Item) => Promise<number>,
    shouldLog?: boolean,
    logPrefix?: string
  ) {
    this.getItemOnMiss = getItemOnMiss;
    this.calculateExpiration = calculateExpiration;
    this.shouldLog = shouldLog ?? false;
    this.logPrefix = logPrefix ?? '';
  }

  private log(message: string) {
    if (this.shouldLog) {
      this.logPrefix ? console.log(this.logPrefix, message) : console.log(message);
    }
  }

  private isCacheValidFor(key: string) {
    const cacheEntry = this.cacheEntries.get(key);
    return cacheEntry != null && cacheEntry.item != null && this.nowTimeInSeconds < cacheEntry.validUntil;
  }

  async get(key: string, opts: Opts): Promise<CacheEntry<Item>> {
    if (!this.isCacheValidFor(key)) {
      this.log(
        `MISS - cache for "${key}" because ${this.nowTimeInSeconds} (now) >= ${
          this.cacheEntries.get(key)?.validUntil
        } (expiration)`
      );
      const item = await this.getItemOnMiss(opts);
      let validUntil = 0;
      try {
        validUntil = item != null ? await this.calculateExpiration(key, item) : 0;
      } catch (err) {
        this.log(`couldn't calculate cachedItemExpiration due to an exception: ${err}`);
      }
      const maxAge = validUntil ? validUntil - this.nowTimeInSeconds : 0;

      this.cacheEntries.set(key, { item, validUntil, maxAge, key });
      this.log(
        `cache for "${key}" now expires at ${validUntil} (${new Date(validUntil * 1_000).toLocaleTimeString()})`
      );
    } else {
      this.log(`HIT - cache for "${key}"`);
    }

    return this.cacheEntries.get(key)!;
  }
}
