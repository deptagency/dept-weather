import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import NodeCache from 'node-cache';
import type { Logger } from 'winston';
import { LOG_TIMESTAMP_FORMAT } from 'constants/server';

export interface CacheEntry<Item> {
  item: Item;
  validUntil: number;
  key: string;
}

dayjs.extend(duration);

export class Cached<Item, Opts> {
  private getItemOnMiss: (opts: Opts) => Promise<Item>;
  private calculateExpiration: (key: string, newItem: Item) => Promise<number>;
  private logger?: Logger;

  private nodeCache: NodeCache;

  private get nowTimeInSeconds(): number {
    return dayjs().unix();
  }

  private formatForLog(timeVal: number) {
    // Get the duration from now until timeVal
    const timeDayjs = dayjs.unix(timeVal);
    let durationFromNow = dayjs.duration(timeDayjs.diff(dayjs()));

    // Round up to nearest minute if within a second
    if (Math.abs(durationFromNow.seconds()) === 59) {
      durationFromNow = durationFromNow.add(durationFromNow.seconds() / 59, 'second');
    }

    const isTimeInPast = durationFromNow.asSeconds() < 0;
    const units = ['d', 'hr', 'm', 's'];
    const dfnByUnit = [
      Math.floor(durationFromNow.asDays()),
      durationFromNow.hours(),
      durationFromNow.minutes(),
      durationFromNow.seconds()
    ].map(amount => Math.abs(amount));

    // Format without leading or trailing 0 amounts (e.g., "0d 1hr 30m 0s" becomes "1hr 30m")
    let durationStr = isTimeInPast ? '' : ' in';
    const idxOfFirstPosDfnByUnit = dfnByUnit.findIndex(amount => amount > 0);
    if (idxOfFirstPosDfnByUnit === -1) {
      durationStr += `${units[units.length - 1]}${dfnByUnit[dfnByUnit.length - 1]} `; // 0s
    } else {
      const idxOfLastPosDfnByUnit = dfnByUnit.length - 1 - [...dfnByUnit].reverse().findIndex(amount => amount > 0);
      durationStr += dfnByUnit
        .map((amount, idx) =>
          idx >= idxOfFirstPosDfnByUnit && idx <= idxOfLastPosDfnByUnit ? ` ${amount}${units[idx]}` : ''
        )
        .join('');
    }
    durationStr += isTimeInPast ? ' ago' : '';

    return `${durationStr}, at ${dayjs.unix(timeVal).format(LOG_TIMESTAMP_FORMAT)} (${timeVal})`;
  }

  constructor(
    getItemOnMiss: (opts: Opts) => Promise<Item>,
    calculateExpiration: (key: string, newItem: Item) => Promise<number>,
    logger?: Logger
  ) {
    this.getItemOnMiss = getItemOnMiss;
    this.calculateExpiration = calculateExpiration;
    this.logger = logger;

    this.nodeCache = new NodeCache({ useClones: false });
  }

  async get(key: string, opts: Opts): Promise<CacheEntry<Item>> {
    let cacheEntry = this.nodeCache.get(key) as CacheEntry<Item> | undefined;
    if (cacheEntry == null) {
      // this.logger?.info(`Cache MISS for "${key}"`);

      const item = await this.getItemOnMiss(opts);
      let validUntil = 0;
      try {
        validUntil = item != null ? await this.calculateExpiration(key, item) : 0;
      } catch (err) {
        this.logger?.error(`Couldn't calculate cachedItemExpiration due to an exception: ${err}`);
      }
      cacheEntry = { item, validUntil, key };

      // const expiresLogPrefix = `Item for "${key}"`;
      if (validUntil) {
        const ttl = validUntil - this.nowTimeInSeconds;
        this.nodeCache.set(key, cacheEntry, ttl);
        // this.logger?.info(`${expiresLogPrefix} has been cached and expires${this.formatForLog(validUntil)}`);
      } else {
        // this.logger?.warn(`${expiresLogPrefix} has NOT been cached`);
      }
    } else {
      this.logger?.info(`Cache HIT for "${key}"`);
    }

    return cacheEntry!;
  }
}
