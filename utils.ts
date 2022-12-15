export const roundOrEmDash = (value: number | null | undefined) => (value != null ? Math.round(value) : '–');
export const roundTensOrEmDash = (value: number | null | undefined) =>
  value != null ? Math.round(value / 10) * 10 : '–';
export const floorOrEmDash = (value: number | null | undefined) => (value != null ? Math.floor(value) : '–');

export const toFixedOrEmDash = (value: number | null | undefined, fractionDigits = 2) =>
  value != null ? value.toFixed(fractionDigits) : '–';
