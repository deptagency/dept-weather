import { Observations, Response } from '../../models/api';
import CardHeader from './CardHeader/CardHeader';
import Condition from './Condition/Condition';
import CurrentTemp from './CurrentTemp/CurrentTemp';
import { AirQuality, Humidity, Precipitation, Pressure, UVIndex, Wind } from './Measurement';
import styles from './Card.module.css';

export default function Card({ observations }: { observations: Response<Observations> }) {
  return (
    <article className={styles.card}>
      <CardHeader lastUpdatedTime={observations.latestReadTime * 1_000}></CardHeader>
      <div className={styles['card-contents']}>
        <div className={styles['card-contents__overview']}>
          {observations.data.wl?.temperature != null ? (
            <CurrentTemp
              temperature={observations.data.wl.temperature}
              feelsLike={observations.data.wl.feelsLike}
            ></CurrentTemp>
          ) : (
            <CurrentTemp temperature={observations.data.nws?.temperature}></CurrentTemp>
          )}
          <Condition condition={observations.data.nws?.textDescription} sunData={observations.data?.sun}></Condition>
        </div>
        <div className={styles['card-contents__measurements']}>
          <Wind wind={observations.data.wl?.wind ?? observations.data.nws?.wind}></Wind>
          <UVIndex epaData={observations.data.epa}></UVIndex>
          <AirQuality airnowData={observations.data.airnow}></AirQuality>
          <Humidity humidity={observations.data.wl?.humidity ?? observations.data.nws?.humidity}></Humidity>
          <Pressure pressure={observations.data.wl?.pressure ?? observations.data.nws?.pressure}></Pressure>
          {observations.data.wl?.rainfall?.last24Hrs != null ? (
            <Precipitation
              precipitation={observations.data.wl.rainfall.last24Hrs}
              label="Last 24hr Rainfall"
            ></Precipitation>
          ) : (
            <Precipitation
              precipitation={observations.data.nws?.precipitation?.last6Hrs}
              label="Last 6hr Precip"
            ></Precipitation>
          )}
        </div>
      </div>
    </article>
  );
}
