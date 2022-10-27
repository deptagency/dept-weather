export interface QuantitativeValue {
  value: number | null;
  unitCode: string;
}

export interface QuantitativeMinMaxValue {
  minValue: number | null;
  maxValue: number | null;
  unitCode: string;
}
