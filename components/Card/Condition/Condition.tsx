import Image from 'next/image';
import { DefaultIconMapping, DefaultIcons, IconCondition } from '../../../models';
import { SunriseSunsetObservations } from '../../../models/api';
import styles from './Condition.module.css';

const getWeatherIconSrc = (condition: string, sunData?: SunriseSunsetObservations) => {
  const conditionUpped = condition.toUpperCase();
  let match: DefaultIconMapping = DefaultIcons[conditionUpped as IconCondition] ?? undefined;
  if (match == undefined) {
    const conditions = conditionUpped.split(' and ');
    for (const condition of conditions) {
      match = DefaultIcons[condition as IconCondition] ?? undefined;
      if (match != null) {
        break;
      }
    }
  }

  let isDay = true;
  if (sunData?.sunrise != null && sunData?.sunset != null) {
    const now = new Date();
    const sunrise = new Date(sunData.sunrise * 1_000);
    const sunset = new Date(sunData.sunset * 1_000);
    isDay = sunrise <= now && now <= sunset;
  }

  return match != undefined
    ? `/weather-icons/default/${typeof match === 'string' ? match : match[isDay ? 'day' : 'night']}`
    : undefined;
};

const WeatherIcon = (condition: string, sunData?: SunriseSunsetObservations) => {
  const iconSrc = getWeatherIconSrc(condition, sunData);
  return iconSrc ? (
    <div className={styles['condition__icon']}>
      <Image src={iconSrc} layout="fill" objectFit="contain" alt=""></Image>
    </div>
  ) : (
    <></>
  );
};

const MAXIMUM_CONDITION_TEXT_LENGTH = 20;
export default function Condition({
  condition,
  sunData
}: {
  condition: string | null | undefined;
  sunData?: SunriseSunsetObservations;
}) {
  return condition ? (
    <div className={`${styles.condition} ${styles['condition--large']}`}>
      {WeatherIcon(condition, sunData)}
      <p className={styles['condition__label']}>
        {condition.length > MAXIMUM_CONDITION_TEXT_LENGTH ? condition.split(' and ')[0] : condition}
      </p>
    </div>
  ) : (
    <></>
  );
}
