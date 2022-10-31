import Image from 'next/image';
import { DefaultIconMapping, DefaultIcons, IconCondition } from '../../../models';
import { SunriseSunsetObservations } from '../../../models/api';
import styles from './Condition.module.css';

type ConditionSize = 'small' | 'large';

const getWeatherIconSrc = (condition: string, sunData?: SunriseSunsetObservations) => {
  const conditionUpped = condition.toUpperCase();
  let match: DefaultIconMapping = DefaultIcons[conditionUpped as IconCondition] ?? undefined;
  if (match == undefined) {
    const subConditions = conditionUpped.split(new RegExp(` *and *`, 'i'));
    for (const subCon of subConditions) {
      match = DefaultIcons[subCon.trim() as IconCondition] ?? undefined;
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

const WeatherIcon = (condition: string, size: ConditionSize, sunData?: SunriseSunsetObservations) => {
  const iconSrc = getWeatherIconSrc(condition, sunData);
  return iconSrc ? (
    <div className={`${styles['condition__icon']}  ${size === 'small' ? styles['condition__icon--small'] : ''}`}>
      <Image src={iconSrc} layout="fill" objectFit="contain" alt=""></Image>
    </div>
  ) : (
    <></>
  );
};

const MAXIMUM_CONDITION_TEXT_LENGTH = 20;
export default function Condition({
  condition,
  size,
  sunData
}: {
  condition: string | null | undefined;
  size: ConditionSize;
  sunData?: SunriseSunsetObservations;
}) {
  return condition ? (
    <div className={styles.condition}>
      {WeatherIcon(condition, size, sunData)}
      <p className={`${styles['condition__label']} ${size === 'small' ? styles['condition__label--small'] : ''}`}>
        {condition.length > MAXIMUM_CONDITION_TEXT_LENGTH ? condition.split(' and ')[0] : condition}
      </p>
    </div>
  ) : (
    <></>
  );
}
