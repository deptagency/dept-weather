import Image from 'next/image';
import { useEffect, useState } from 'react';
import { DefaultIconMapping, DefaultIcons, IconCondition } from 'models';
import { ConditionSize } from './condition-size.model';
import styles from './Condition.module.css';

const getWeatherIconSrc = (condition: string, isNight?: boolean) => {
  const conditionUpped = condition.toUpperCase();
  let match: DefaultIconMapping = DefaultIcons[conditionUpped as IconCondition] ?? undefined;
  if (match == null) {
    const baseCondition = conditionUpped.replaceAll(
      new RegExp(' *(?:isolated|scattered|occasional|periods of|areas of) *', 'ig'),
      ''
    );
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

export default function ConditionIcon({
  className,
  condition,
  size,
  useEmptyDivIfNoIcon,
  isNight
}: {
  className?: string;
  condition: string | null | undefined;
  size: ConditionSize;
  useEmptyDivIfNoIcon: boolean;
  isNight?: boolean;
}) {
  const [iconSrc, setIconSrc] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (condition) {
      const newIconSrc = getWeatherIconSrc(condition, isNight);
      setIconSrc(newIconSrc);
    }
  }, [condition, isNight]);

  return iconSrc || useEmptyDivIfNoIcon ? (
    <div
      className={`${styles.condition__icon} ${styles[`condition__icon--${size}`]}${className ? ` ${className}` : ''}`}
    >
      {iconSrc ? (
        <Image src={iconSrc} className={styles.condition__icon__image} fill sizes="2rem" alt=""></Image>
      ) : (
        <></>
      )}
    </div>
  ) : (
    <></>
  );
}
