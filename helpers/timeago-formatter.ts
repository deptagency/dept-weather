import { Formatter, Suffix, Unit } from 'react-timeago';

export const getTimeAgoFormatter = ({ exclude, useJustNow }: { exclude?: 'past' | 'future'; useJustNow: boolean }) =>
  ((value: number, unit: Unit, suffix: Suffix, epochMiliseconds: number, nextFormatter: Formatter) => {
    const isInFuture = suffix === 'from now';
    const isInPast = suffix === 'ago';

    const customPrefix = isInFuture ? 'in ' : '';
    const customSuffix = isInPast ? ` ${suffix}` : '';

    let formattedValue: string | undefined;
    if (
      (useJustNow && unit === 'second' && value <= 30) ||
      (isInFuture && exclude === 'future') ||
      (isInPast && exclude === 'past')
    )
      return 'just now';
    else if (unit === 'second' || (unit === 'minute' && value < 2)) formattedValue = 'a moment';
    else if (unit === 'minute') formattedValue = `${value}m`;
    else if (unit === 'hour') formattedValue = `${value}hr`;
    else if (unit === 'day') formattedValue = `${value}d`;
    else if (unit === 'week') formattedValue = `${value}w`;
    else if (unit === 'month') formattedValue = `${value}mo`;
    else if (unit === 'year') formattedValue = `${value}yr`;

    return formattedValue
      ? `${customPrefix}${formattedValue}${customSuffix}`
      : nextFormatter(value, unit, suffix, epochMiliseconds);
  }) as Formatter;
