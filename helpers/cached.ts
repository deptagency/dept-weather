export class Cached<T> {
  private getItemOnMiss: () => Promise<T>;
  private calculateExpiration: (newItem: T) => Promise<number>;

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

  constructor(getItemOnMiss: () => Promise<T>, calculateExpiration: (newItem: T) => Promise<number>) {
    this.getItemOnMiss = getItemOnMiss;
    this.calculateExpiration = calculateExpiration;
  }

  async get(): Promise<T> {
    if (!this.isCacheValid) {
      console.log(
        `cache MISS because ${this.nowTimeInSeconds} (now) >= ${this.cachedItemExpiration} (cachedItemExpiration)`
      );
      this.cachedItem = await this.getItemOnMiss();

      try {
        this.cachedItemExpiration = await this.calculateExpiration(this.cachedItem);
      } catch (err) {
        console.log(`couldn't calculate cachedItemExpiration due to an exception: ${err}`);
        this.cachedItemExpiration = 0;
      }
      console.log(`cache now expires at ${this.cachedItemExpiration}`);
    } else {
      console.log('cache HIT');
    }

    return this.cachedItem!;
  }
}
