import { NwsForecastPeriod } from 'models/api';
import { useEffect, useState } from 'react';
import Condition from '../Condition/Condition';
import { PrecipitationForecast, WindForecast } from '../Measurement';
import styles from './ForecastPeriod.module.css';

const removeWord = (str: string, word: string) => str.replace(new RegExp(` *${word} *`, 'ig'), '');
const splitOn = (str: string, word: string) => str.split(new RegExp(` *${word} *`, 'i'));

const shortenForecastToCondition = (forecast?: NwsForecastPeriod) => {
  let condition = forecast?.shortForecast ?? '';

  const wordsToRemove = ['Likely', 'Chance', 'Slight', 'Possible'];
  for (const word of wordsToRemove) {
    condition = removeWord(condition, word);
  }
  condition = splitOn(condition, 'And')[0];
  condition = splitOn(condition, 'Then')[0];

  return condition.trim();
};

const CHANCE_OF_PRECIP_SEARCH_TEXT = 'Chance of precipitation is';
const getChanceOfPrecip = (detailedForecast: string | null | undefined) => {
  if (detailedForecast != null) {
    const dfSplitOnSearchText = splitOn(detailedForecast, CHANCE_OF_PRECIP_SEARCH_TEXT);
    if (dfSplitOnSearchText.length === 2) {
      const chanceOfPrecipStr = dfSplitOnSearchText[1].split('%')[0];
      const chanceOfPrecipNum = Number(chanceOfPrecipStr);
      if (chanceOfPrecipStr.length > 0 && chanceOfPrecipNum != null && !isNaN(chanceOfPrecipNum)) {
        return chanceOfPrecipNum;
      }
    } else if (dfSplitOnSearchText.length < 2) {
      return 0;
    }
  }

  return null;
};

export default function ForecastPeriod({ forecast, isDaytime }: { forecast?: NwsForecastPeriod; isDaytime: boolean }) {
  const condition = shortenForecastToCondition(forecast);
  const chanceOfPrecipitation = getChanceOfPrecip(forecast?.detailedForecast);
  const [periodLabel, setPeriodLabel] = useState<string>('');
  useEffect(() => setPeriodLabel(isDaytime ? 'Day' : 'Night'), [isDaytime]);
  return (
    <div className={styles['forecast-period']}>
      <div className={styles['forecast-period__overview']}>
        <h4 className={styles['forecast-period__overview__label']} aria-label={periodLabel}>
          {periodLabel.toUpperCase()}
        </h4>{' '}
        <Condition condition={condition} size="small" isNight={forecast?.isDaytime === false}></Condition>
      </div>
      <div className={styles['forecast-period__measurements']}>
        <WindForecast wind={forecast?.wind}></WindForecast>
        <PrecipitationForecast chanceOfPrecipitation={chanceOfPrecipitation}></PrecipitationForecast>
      </div>
    </div>
  );
}
