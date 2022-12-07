import Image from 'next/image';
import { DefaultIconMapping, DefaultIcons, IconCondition } from 'models';
import styles from './Condition.module.css';

type ConditionSize = 'small' | 'large';

const getWeatherIconSrc = (condition: string, isNight?: boolean) => {
  const conditionUpped = condition.toUpperCase();
  let match: DefaultIconMapping = DefaultIcons[conditionUpped as IconCondition] ?? undefined;
  if (match == null) {
    const baseCondition = conditionUpped
      .replaceAll(new RegExp(' *isolated *', 'ig'), '')
      .replaceAll(new RegExp(' *scattered *', 'ig'), '')
      .replaceAll(new RegExp(' *occasional *', 'ig'), '')
      .replaceAll(new RegExp(' *periods of *', 'ig'), '')
      .replaceAll(new RegExp(' *areas of *', 'ig'), '');
    match = DefaultIcons[baseCondition.trim() as IconCondition] ?? undefined;
    if (match == null) {
      const subConditions = conditionUpped.split(new RegExp(' *and *', 'i'));
      for (const subCon of subConditions) {
        match = DefaultIcons[subCon.trim() as IconCondition] ?? undefined;
        if (match != null) {
          break;
        }
      }
    }
    if (match == null) {
      const conditionWordsReversed = conditionUpped.split(' ').reverse();
      for (const word of conditionWordsReversed) {
        match = DefaultIcons[word.trim() as IconCondition] ?? undefined;
        if (match != null) {
          break;
        }
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
    <div className={`${styles.condition__icon}  ${size === 'small' ? styles['condition__icon--small'] : ''}`}>
      <Image src={iconSrc} className={styles.condition__icon__image} fill sizes="2rem" alt=""></Image>
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
  return (
    <div className={styles.condition}>
      {condition ? WeatherIcon(condition, size, isNight) : <></>}
      <p className={`${styles.condition__label} ${size === 'small' ? styles['condition__label--small'] : ''}`}>
        {condition ? (condition.length > MAXIMUM_CONDITION_TEXT_LENGTH ? condition.split(' and ')[0] : condition) : '–'}
      </p>
    </div>
  );
}
