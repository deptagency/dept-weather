export const roundOrEmDash = (value: number | null | undefined) => (value != null ? Math.round(value) : '–');

export const toFixedOrEmDash = (value: number | null | undefined, fractionDigits = 2) =>
  value != null ? value.toFixed(fractionDigits) : '–';
