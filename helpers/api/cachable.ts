import type { Logger } from 'winston';

export interface CachableEntry<Item> {
  item: Item;
  validUntil: number;
  key: string;
}

export class Cachable<Item, Opts> {
  private getItem: (opts: Opts) => Promise<Item>;
  private calculateExpiration: (key: string, newItem: Item) => Promise<number>;
  private logger?: Logger;

  constructor(
    getItem: (opts: Opts) => Promise<Item>,
    calculateExpiration: (key: string, newItem: Item) => Promise<number>,
    logger?: Logger
  ) {
    this.getItem = getItem;
    this.calculateExpiration = calculateExpiration;
    this.logger = logger;
  }

  async get(key: string, opts: Opts): Promise<CachableEntry<Item>> {
    const item = await this.getItem(opts);
    let validUntil = 0;
    try {
      validUntil = item != null ? await this.calculateExpiration(key, item) : 0;
    } catch (err) {
      this.logger?.error(`Couldn't calculate cachedItemExpiration due to an exception: ${err}`);
    }
    return { key, item, validUntil };
  }
}
