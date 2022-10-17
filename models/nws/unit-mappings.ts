import { Unit } from '../unit.enum';

export const UnitMappings: Record<string, Unit> = {
  'wmoUnit:degC': Unit.C,
  'wmoUnit:km_h-1': Unit.KM,
  'wmoUnit:Pa': Unit.PASCAL
};
