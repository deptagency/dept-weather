export interface Response<T> {
  data: T;
  warnings: string[];
  errors: string[];
  latestReadTime: number;
  validUntil: number;
}
