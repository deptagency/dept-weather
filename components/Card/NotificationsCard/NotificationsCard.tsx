import { useCallback, useEffect, useState } from 'react';
import { CardHeader } from 'components/Card/CardHeader/CardHeader';
import { LOCAL_STORAGE_UUID_KEY } from 'constants/client';
import { APIRoute, getPath } from 'models/api/api-route.model';
import { CityAlertsResponse } from 'models/api/push/city-alerts.model';
import { SubscribeResponse } from 'models/api/push/subscribe.model';
import { UnSubscribeResponse } from 'models/api/push/unsubscribe.model';
import { Response as ResponseModel } from 'models/api/response.model';
import { Color } from 'models/color.enum';

import styles from './NotificationsCard.module.css';
import baseStyles from 'components/Card/Card.module.css';
import cardHeaderStyles from 'components/Card/CardHeader/CardHeader.module.css';

const base64ToUint8Array = (base64: string) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(b64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export function NotificationsCard({ geonameid }: { geonameid: string | undefined }) {
  const [isChangingSubscription, setIsChangingSubscription] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>();

  const [subscription, setSubscription] = useState<PushSubscription>();
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();

  const [uuid, setUuid] = useState<string | undefined>(() =>
    // Only run on client-side (i.e., when window object is available)
    typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_UUID_KEY) ?? undefined : undefined
  );

  const [subscribedCities, setSubscribedCities] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'workbox' in window &&
        window.workbox !== undefined
      ) {
        navigator.serviceWorker.ready.then(reg => {
          reg.pushManager.getSubscription().then(sub => {
            setRegistration(reg);
            if (sub && !(sub.expirationTime && Date.now() > sub.expirationTime - 5 * 60 * 1000)) {
              // eslint-disable-next-line no-console
              console.log('Initialized! Subscription detected');
              setSubscription(sub);
              setIsSubscribed(true);
            } else {
              setIsSubscribed(false);
            }
          });
        });
      }
    })();
  }, []);

  const onPatchDeleteClick = useCallback(
    async (method: 'PATCH' | 'DELETE') => {
      setIsChangingSubscription(true);

      const res = await fetch(getPath(APIRoute.PUSH_CITY_ALERTS), {
        method,
        body: JSON.stringify({ uuid, geonameid: Number(geonameid) })
      });
      const resJSON: Omit<ResponseModel<CityAlertsResponse | null>, 'validUntil' | 'latestReadTime'> = await res.json();
      if (resJSON?.data != null) {
        setSubscribedCities(resJSON.data.map(c => `${c.cityName}, ${c.stateCode} (${c.geonameid})`));
      }

      if (!res.ok || resJSON.errors.length || resJSON.warnings.length) {
        alert(
          `[${res.status}] /api/push/city-alerts\nErrors: ${resJSON.errors
            .map(str => `"${str}"`)
            .join(', ')}\nWarnings: ${resJSON.warnings.map(str => `"${str}"`).join(', ')}`
        );
      }

      setIsChangingSubscription(false);
      setIsSubscribed(res.ok);
    },
    [uuid, geonameid]
  );

  return (
    <article className={`${baseStyles.card} ${styles['notifications-card']}`}>
      <CardHeader
        backgroundColor={Color.ONYX}
        contents={
          <div className={`${cardHeaderStyles['card-header__contents']}  ${styles['notifications-card__contents']}`}>
            <h2 className={cardHeaderStyles['card-header__contents__title']}>Notifications</h2>
            <button
              className={styles['notifications-card-header__contents__button']}
              disabled={isChangingSubscription}
              onClick={async () => {
                if (!isSubscribed) {
                  setIsChangingSubscription(true);

                  const sub = await registration!.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: base64ToUint8Array(process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY!)
                  });
                  setSubscription(sub);

                  const res = await fetch(getPath(APIRoute.PUSH_SUBSCRIBE), {
                    method: 'PUT',
                    body: JSON.stringify({ subscription: sub.toJSON(), uuid })
                  });
                  const resJSON: Omit<
                    ResponseModel<SubscribeResponse | null>,
                    'validUntil' | 'latestReadTime'
                  > = await res.json();
                  if (resJSON?.data?.uuid) {
                    localStorage.setItem(LOCAL_STORAGE_UUID_KEY, resJSON.data.uuid);
                    setUuid(resJSON.data.uuid);
                  }

                  if (!res.ok || resJSON.errors.length || resJSON.warnings.length) {
                    await sub.unsubscribe();
                    alert(
                      `[${res.status}] /api/push/subscribe\nErrors: ${resJSON.errors
                        .map(str => `"${str}"`)
                        .join(', ')}\nWarnings: ${resJSON.warnings.map(str => `"${str}"`).join(', ')}`
                    );
                  }

                  setIsChangingSubscription(false);
                  setIsSubscribed(res.ok);
                } else if (isSubscribed && subscription != null) {
                  setIsChangingSubscription(true);

                  const res = await fetch(getPath(APIRoute.PUSH_UNSUBSCRIBE), {
                    method: 'PATCH',
                    body: JSON.stringify({ uuid })
                  });
                  const resJSON: Omit<
                    ResponseModel<UnSubscribeResponse | null>,
                    'validUntil' | 'latestReadTime'
                  > = await res.json();
                  if (resJSON?.data?.uuid) {
                    localStorage.setItem(LOCAL_STORAGE_UUID_KEY, resJSON.data.uuid);
                    setUuid(resJSON.data.uuid);
                  }

                  if (!res.ok) {
                    alert(
                      `[${res.status}] /api/push/unsubscribe\nErrors: ${resJSON.errors
                        .map(str => `"${str}"`)
                        .join(', ')}\nWarnings: ${resJSON.warnings.map(str => `"${str}"`).join(', ')}`
                    );
                  } else {
                    await subscription.unsubscribe();
                  }

                  setIsChangingSubscription(false);
                  setIsSubscribed(!res.ok);
                }
              }}
              type="button"
            >
              Turn {isSubscribed ? 'off' : 'on'}
            </button>
          </div>
        }
      />
      <div className={styles['notifications-card-content']}>
        <div className={styles['status-grid']}>
          <h4>UUID:</h4>
          <p suppressHydrationWarning>{uuid ? uuid : 'undefined'}</p>
          {/* <p>isSubscribed?</p>
          <h4>{isSubscribed ? 'YES' : 'NO'}</h4> */}
        </div>

        <button
          disabled={!isSubscribed || isChangingSubscription}
          onClick={() => onPatchDeleteClick('PATCH')}
          type="button"
        >
          PATCH
        </button>
        <button disabled={isChangingSubscription} onClick={() => onPatchDeleteClick('DELETE')} type="button">
          DELETE
        </button>

        {/* <button
          disabled={permissionState !== 'prompt'}
          onClick={() => {
            Notification.requestPermission().then(value => {
              if (value === 'denied' || value === 'granted') {
                setPermissionState(value);
              }
            });
          }}
          type="button"
        >
          Request permission
        </button>
        <button
          disabled={registration == null || permissionState !== 'granted'}
          onClick={async () => {
            setIsSubscribed(prev => !prev);
            if (!isSubscribed) {
              const sub = await registration!.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: base64ToUint8Array(process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY!)
              });
              // TODO: you should call your API to save subscription data on server in order to send web push notification from server
              setSubscription(sub);
              setIsSubscribed(true);
            } else if (isSubscribed && subscription != null) {
              await subscription.unsubscribe();
              // TODO: you should call your API to delete or invalidate subscription data on server
              setSubscription(undefined);
              setIsSubscribed(false);
            }
          }}
          type="button"
        >
          {`${isSubscribed ? 'Uns' : 'S'}ubscribe`}
        </button> */}
        {subscribedCities.length > 0 && (
          <>
            <h4 style={{ marginBottom: '0.5rem' }}>/city-alerts response:</h4>
            {subscribedCities.map((cityAndStateCode, idx) => (
              <p key={idx} style={{ marginTop: '0.25rem' }}>
                {cityAndStateCode}
              </p>
            ))}
          </>
        )}
      </div>
    </article>
  );
}
