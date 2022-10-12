export interface Response<T> {
  data: T;
  warnings: string[];
  errors: string[];
  validUntil: number;
}
