export interface QuantitativeValue {
  value: number | null;
  unitCode: string;
}

export interface QuantitativeMinMaxValue {
  minValue: number | null;
  maxValue: number | null;
  unitCode: string;
}

export interface GridpointQuantitativeValueLayer {
  uom?: string;
  values: GridpointQuantitativeValue[];
}

export interface GridpointQuantitativeValue {
  value: number | null;
  validTime: string;
}
