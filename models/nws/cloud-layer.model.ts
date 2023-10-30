import { QuantitativeValue } from 'models/nws/quantitative-value.model';

export interface CloudLayer {
  base: QuantitativeValue;
  amount: MetarSkyCoverage;
}

export enum MetarSkyCoverage {
  OVC = 'OVC',
  BKN = 'BKN',
  SCT = 'SCT',
  FEW = 'FEW',
  SKC = 'SKC',
  CLR = 'CLR',
  VV = 'VV'
}
