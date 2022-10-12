export class Cached<T> {
  private getItemOnMiss: () => Promise<T>;
  private calculateExpiration: (newItem: T) => Promise<number>;
  private shouldLog: boolean;
  private logPrefix: string;

  private cachedItem?: T;
  private cachedItemExpiration = 0;

  private get nowTimeInSeconds(): number {
    return Math.ceil(new Date().getTime() / 1000);
  }
  private get isCacheValid(): boolean {
    return (
      this.cachedItem !== null && this.cachedItem !== undefined && this.nowTimeInSeconds < this.cachedItemExpiration
    );
  }
  get maxAge(): number {
    return this.isCacheValid ? this.cachedItemExpiration - this.nowTimeInSeconds : 0;
  }

  constructor(
    getItemOnMiss: () => Promise<T>,
    calculateExpiration: (newItem: T) => Promise<number>,
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
      console.log(`${this.logPrefix}${message}`);
    }
  }

  async get(): Promise<T> {
    if (!this.isCacheValid) {
      this.log(
        `cache MISS because ${this.nowTimeInSeconds} (now) >= ${this.cachedItemExpiration} (cachedItemExpiration)`
      );
      this.cachedItem = await this.getItemOnMiss();

      try {
        this.cachedItemExpiration = await this.calculateExpiration(this.cachedItem);
      } catch (err) {
        this.log(`couldn't calculate cachedItemExpiration due to an exception: ${err}`);
        this.cachedItemExpiration = 0;
      }
      this.log(`cache now expires at ${this.cachedItemExpiration}`);
    } else {
      this.log('cache HIT');
    }

    return this.cachedItem!;
  }
}
