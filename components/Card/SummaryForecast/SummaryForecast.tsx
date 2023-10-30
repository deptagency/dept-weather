import { useEffect, useState } from 'react';
import Condition from 'components/Card/Condition/Condition';
import { PrecipitationForecast, Wind } from 'components/Card/Measurement';
import { NwsPeriodForecast } from 'models/api';

import styles from './SummaryForecast.module.css';

const removeWord = (str: string, word: string) => str.replace(new RegExp(` *${word} *`, 'ig'), '');
const splitOn = (str: string, word: string) => str.split(new RegExp(` *${word} *`, 'i'));

const simplifyCondition = (conditionIn: string | null | undefined) => {
  let condition = conditionIn ?? '';

  const wordsToRemove = ['Likely', 'Chance', 'Slight', 'Possible'];
  for (const word of wordsToRemove) {
    condition = removeWord(condition, word);
  }
  condition = splitOn(condition, 'And')[0];
  condition = splitOn(condition, 'Then')[0];

  return condition.trim();
};

export default function SummaryForecast({
  forecast,
  isDaytime
}: {
  forecast: NwsPeriodForecast | null | undefined;
  isDaytime: boolean;
}) {
  const [condition, setCondition] = useState<string>('');
  useEffect(() => setCondition(simplifyCondition(forecast?.condition)), [forecast?.condition]);

  const [periodLabel, setPeriodLabel] = useState<string>('');
  useEffect(() => setPeriodLabel(isDaytime ? 'Day' : 'Night'), [isDaytime]);

  return (
    <div className={styles['summary-forecast']}>
      <div className={styles['summary-forecast__overview']}>
        <h4 aria-label={periodLabel} className={styles['summary-forecast__overview__label']}>
          {periodLabel.toUpperCase()}
        </h4>

        <Condition condition={condition} isNight={!isDaytime} size="small" />
      </div>
      <div className={styles['summary-forecast__measurements']}>
        <Wind includeGustSpeed={false} wind={forecast?.wind} />
        <PrecipitationForecast chanceOfPrecipitation={forecast?.chanceOfPrecip} />
      </div>
    </div>
  );
}
