import { StandardCardHeader } from 'components/Card/CardHeader/StandardCardHeader';
import { Condition } from 'components/Card/Condition/Condition';
import { CurrentTemp } from 'components/Card/CurrentTemp/CurrentTemp';
import { AirQuality } from 'components/Card/Measurement/AirQuality';
import { Humidity } from 'components/Card/Measurement/Humidity';
import { Precipitation } from 'components/Card/Measurement/Precipitation';
import { Pressure } from 'components/Card/Measurement/Pressure';
import { UVIndex } from 'components/Card/Measurement/UVIndex';
import { Wind } from 'components/Card/Measurement/Wind';
import { Observations, SunTimesObservations } from 'models/api/observations.model';
import { Color } from 'models/color.enum';

import styles from './Card.module.css';

const getIsNight = (sunData?: SunTimesObservations) => {
  let isNight = false;
  if (sunData?.sunrise != null && sunData?.sunset != null) {
    const now = new Date();
    const sunrise = new Date(sunData.sunrise * 1_000);
    const sunset = new Date(sunData.sunset * 1_000);
    isNight = now < sunrise || sunset < now;
  }
  return isNight;
};

export function ObservationsCard({
  isLoading,
  latestReadTime,
  observations
}: {
  isLoading?: boolean;
  latestReadTime?: number;
  observations?: Observations;
}) {
  return (
    <article className={styles.card}>
      <StandardCardHeader
        backgroundColor={Color.INDIGO}
        foregroundColor={Color.WHITE}
        isLoading={isLoading}
        label="Now"
        lastUpdatedTime={latestReadTime}
      />
      <div className={styles['card-contents']}>
        <div className={styles['card-contents__overview']}>
          <CurrentTemp observations={observations?.wl?.temperature != null ? observations.wl : observations?.nws} />
          <Condition
            condition={observations?.nws?.textDescription}
            isNight={getIsNight(observations?.sun)}
            size="large"
          />
        </div>
        <div className={styles['card-contents__measurements']}>
          <Wind
            includeGustSpeed={true}
            wind={observations?.wl?.wind?.speed != null ? observations.wl.wind : observations?.nws?.wind}
          />
          <UVIndex epaData={observations?.epa} />
          <AirQuality airnowData={observations?.airnow} />
          <Humidity humidity={observations?.wl?.humidity ?? observations?.nws?.humidity} />
          <Pressure
            pressure={
              observations?.wl?.pressure?.atSeaLevel != null ? observations.wl.pressure : observations?.nws?.pressure
            }
          />
          {observations?.wl?.rainfall?.last24Hrs != null ? (
            <Precipitation label="Last 24hr Rainfall" precipitation={observations.wl.rainfall.last24Hrs} />
          ) : (
            <Precipitation label="Last 6hr Precip" precipitation={observations?.nws?.precipitation?.last6Hrs} />
          )}
        </div>
      </div>
    </article>
  );
}
