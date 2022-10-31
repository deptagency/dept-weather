import Image from 'next/image';
import { DefaultIconMapping, DefaultIcons, IconCondition } from '../../../models';
import styles from './Condition.module.css';

type ConditionSize = 'small' | 'large';

const getWeatherIconSrc = (condition: string, isNight?: boolean) => {
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

  return match != undefined
    ? `/weather-icons/default/${typeof match === 'string' ? match : match[isNight ? 'night' : 'day']}`
    : undefined;
};

const WeatherIcon = (condition: string, size: ConditionSize, isNight?: boolean) => {
  const iconSrc = getWeatherIconSrc(condition, isNight);
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
  isNight
}: {
  condition: string | null | undefined;
  size: ConditionSize;
  isNight?: boolean;
}) {
  return condition ? (
    <div className={styles.condition}>
      {WeatherIcon(condition, size, isNight)}
      <p className={`${styles['condition__label']} ${size === 'small' ? styles['condition__label--small'] : ''}`}>
        {condition.length > MAXIMUM_CONDITION_TEXT_LENGTH ? condition.split(' and ')[0] : condition}
      </p>
    </div>
  ) : (
    <></>
  );
}
