import { Unit } from 'models/unit.enum';

export const NwsUnits: Record<string, Unit> = {
  'wmoUnit:degC': Unit.C,
  'wmoUnit:km_h-1': Unit.KM,
  'wmoUnit:Pa': Unit.PASCAL,
  'wmoUnit:m': Unit.METERS,
  'wmoUnit:mm': Unit.MILLIMETERS
};
