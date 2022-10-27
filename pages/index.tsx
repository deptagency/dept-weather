import Head from 'next/head';
import useSWR from 'swr';
import { Card } from '../components/Card';

import { APIRoute, getPath, Observations, Response } from '../models/api';
import styles from '../styles/Home.module.css';

const fetcher = (key: string) => fetch(key).then(res => res.json());

const useObservations = (): { observations?: Response<Observations>; isLoading: boolean; isError: boolean } => {
  const { data, error } = useSWR<Response<Observations>>(getPath(APIRoute.CURRENT), fetcher);

  return {
    observations: data,
    isLoading: !error && !data,
    isError: error
  };
};

export default function Home() {
  const { observations, isLoading, isError } = useObservations();

  return (
    <div className={styles.container}>
      <Head>
        <title>#aq Weather</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0rem' }}>
        <img src="skylines/boston.svg" style={{ height: '8rem', objectFit: 'scale-down' }}></img>
      </div>
      {observations ? (
        !isError && observations.data ? (
          <Card observations={observations}></Card>
        ) : (
          <>
            <h1>Something went wrong :(</h1>
            <br />
            {observations?.errors.map(error => (
              <h3 key={error}>{error}</h3>
            ))}
          </>
        )
      ) : (
        <h1>Loading...</h1>
      )}
    </div>
  );
}
