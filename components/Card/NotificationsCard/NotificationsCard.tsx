import { useCallback, useEffect, useId, useState } from 'react';
import AnimateHeight from 'react-animate-height';
import { CardHeader } from 'components/Card/CardHeader/CardHeader';
import { LOCAL_STORAGE_UUID_KEY, UI_ANIMATION_DURATION } from 'constants/client';
import { API_GEONAMEID_KEY, API_UUID_KEY } from 'constants/shared';
import { SearchQueryHelper } from 'helpers/search-query-helper';
import { useShouldContinueRendering } from 'hooks/use-should-continue-rendering';
import { APIRoute, getPath } from 'models/api/api-route.model';
import { CityAlertsResponse } from 'models/api/push/city-alerts.model';
import { SubscribeResponse } from 'models/api/push/subscribe.model';
import { UnSubscribeResponse } from 'models/api/push/unsubscribe.model';
import { Response as ResponseModel } from 'models/api/response.model';
import { SearchResultCity } from 'models/cities/cities.model';
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

export function NotificationsCard({ selectedCity }: { selectedCity: SearchResultCity | undefined }) {
  const [supportsNotifications, setSupportsNotifications] = useState<boolean | undefined>();

  const [permissionState, setPermissionState] = useState<NotificationPermission>();
  const [isSubscribed, setIsSubscribed] = useState<boolean>();

  const [subscription, setSubscription] = useState<PushSubscription>();
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();

  const [isChangingSubscription, setIsChangingSubscription] = useState(true);

  const [uuid, setUuid] = useState<string | undefined>();

  const [subscribedCities, setSubscribedCities] = useState<[string, string][]>([]);

  useEffect(() => {
    setSupportsNotifications(typeof window !== 'undefined' && 'Notification' in window);

    let newUuid = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_UUID_KEY) ?? undefined : undefined;
    setUuid(newUuid);

    const refreshUUID = async (sub: PushSubscription) => {
      // Send existing subscription data to get UUID
      // eslint-disable-next-line no-console
      console.log('Sending existing subscription data to get UUID');
      const res = await fetch(getPath(APIRoute.PUSH_SUBSCRIBE), {
        method: 'PUT',
        body: JSON.stringify({ subscription: sub.toJSON() })
      });
      const resJSON: Omit<ResponseModel<SubscribeResponse | null>, 'validUntil' | 'latestReadTime'> = await res.json();
      if (resJSON?.data?.uuid) {
        localStorage.setItem(LOCAL_STORAGE_UUID_KEY, resJSON.data.uuid);
        newUuid = resJSON.data.uuid;
        setUuid(newUuid);
      }

      if (!res.ok || resJSON.errors.length || resJSON.warnings.length) {
        if (!res.ok) {
          await sub.unsubscribe();
        }
        alert(
          `[${res.status}] /api/push/subscribe\nErrors: ${resJSON.errors
            .map(str => `"${str}"`)
            .join(', ')}\nWarnings: ${resJSON.warnings.map(str => `"${str}"`).join(', ')}`
        );
      }
    };

    const getSubscribedCities = async () =>
      fetch(
        getPath(APIRoute.PUSH_CITY_ALERTS, {
          [API_UUID_KEY]: newUuid!
        }),
        {
          method: 'GET'
        }
      );

    (async () => {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        'serviceWorker' in navigator &&
        'workbox' in window &&
        window.workbox !== undefined
      ) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setRegistration(reg);
        if (sub && !(sub.expirationTime && Date.now() > sub.expirationTime - 5 * 60 * 1000)) {
          setSubscription(sub);
          if (!newUuid) {
            await refreshUUID(sub);
          }
          setIsSubscribed(true);
        } else {
          setIsSubscribed(false);
        }

        // Get subscribed cities
        let res = await getSubscribedCities();
        if (res.status === 404 && sub) {
          await refreshUUID(sub);
          res = await getSubscribedCities();
        }
        const resJSON: Omit<
          ResponseModel<CityAlertsResponse | null>,
          'validUntil' | 'latestReadTime'
        > = await res.json();
        setSubscribedCities(resJSON?.data?.map(c => [`${c.cityName}, ${c.stateCode}`, String(c.geonameid)]) ?? []);

        setPermissionState(Notification.permission);
        setIsChangingSubscription(false);
      }
    })();
  }, []);

  const onPatchDeleteClick = useCallback(
    async (method: 'PATCH' | 'DELETE') => {
      setIsChangingSubscription(true);

      const res = await fetch(
        getPath(APIRoute.PUSH_CITY_ALERTS, {
          [API_UUID_KEY]: uuid ?? '',
          [API_GEONAMEID_KEY]: selectedCity?.geonameid ?? ''
        }),
        {
          method
        }
      );
      const resJSON: Omit<ResponseModel<CityAlertsResponse | null>, 'validUntil' | 'latestReadTime'> = await res.json();
      if (resJSON?.data != null) {
        setSubscribedCities(resJSON?.data?.map(c => [`${c.cityName}, ${c.stateCode}`, String(c.geonameid)]) ?? []);
      }

      if (!res.ok || resJSON.errors.length || resJSON.warnings.length) {
        alert(
          `[${res.status}] /api/push/city-alerts\nErrors: ${resJSON.errors
            .map(str => `"${str}"`)
            .join(', ')}\nWarnings: ${resJSON.warnings.map(str => `"${str}"`).join(', ')}`
        );
      }

      setIsChangingSubscription(false);
      if (method === 'PATCH') {
        setIsSubscribed(res.ok);
      }
    },
    [uuid, selectedCity?.geonameid]
  );

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const shouldContinueRendering = useShouldContinueRendering(isExpanded);

  const animatedContentsWrapperId = useId();

  return (
    <article className={`${baseStyles.card} ${styles['notifications-card']}`}>
      <CardHeader
        ariaControls={animatedContentsWrapperId}
        backgroundColor={Color.FOREGROUND_LIGHT}
        contents={
          <div className={`${cardHeaderStyles['card-header__contents']}  ${styles['notifications-card__contents']}`}>
            <h2 className={cardHeaderStyles['card-header__contents__title']}>Notifications</h2>
            <button
              className={styles['notifications-card-header__contents__button']}
              disabled={!supportsNotifications || isChangingSubscription || permissionState === 'denied'}
              onClick={async () => {
                if (!isSubscribed) {
                  setIsChangingSubscription(true);
                  const pushOptions = {
                    userVisibleOnly: true,
                    applicationServerKey: base64ToUint8Array(process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY!)
                  };

                  if (permissionState === 'denied') {
                    setIsChangingSubscription(false);
                    return;
                  } else if (permissionState === 'default') {
                    const newPermissionState = await Notification.requestPermission();
                    setPermissionState(newPermissionState === 'denied' ? 'denied' : 'granted');
                  }

                  const sub = await registration!.pushManager.subscribe(pushOptions);
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
                    method: 'DELETE',
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
              suppressHydrationWarning
              type="button"
            >
              {supportsNotifications ? `Turn ${isSubscribed ? 'off' : 'on'}` : 'Not Supported'}
            </button>
          </div>
        }
        foregroundColor={Color.BACKGROUND}
        isExpanded={isExpanded}
        roundBottomCornersWhenCollapsed
        setIsExpanded={setIsExpanded}
      />
      <AnimateHeight duration={UI_ANIMATION_DURATION} height={isExpanded ? 'auto' : 0} id={animatedContentsWrapperId}>
        {(isExpanded || shouldContinueRendering) && (
          <div className={styles['notifications-card-content']}>
            <div className={styles['status-grid']}>
              <h4>UUID:</h4>
              <p suppressHydrationWarning>{uuid ? uuid : 'undefined'}</p>
              <h4>Permission:</h4>
              <p>{(permissionState ?? '').toUpperCase()}</p>
            </div>

            {subscribedCities.find(val => val[1] === selectedCity?.geonameid) == null ? (
              <button
                disabled={!isSubscribed || isChangingSubscription || !uuid}
                onClick={() => onPatchDeleteClick('PATCH')}
                type="button"
              >
                PATCH{selectedCity ? ` ${SearchQueryHelper.getCityAndStateCode(selectedCity)}` : ''}
              </button>
            ) : (
              <button
                disabled={isChangingSubscription || !uuid}
                onClick={() => onPatchDeleteClick('DELETE')}
                type="button"
              >
                DELETE{selectedCity ? ` ${SearchQueryHelper.getCityAndStateCode(selectedCity)}` : ''}
              </button>
            )}

            {subscribedCities.length > 0 && (
              <>
                <h4 style={{ marginBottom: '0.5rem' }}>Subscribed cities:</h4>
                <div className={styles['subscribed-cities-grid']}>
                  {subscribedCities.map(([cityAndStateCode, gid], idx) => (
                    <>
                      <h4 key={`${idx}-1`}>{gid}</h4>
                      <p key={`${idx}-0`}>{cityAndStateCode}</p>
                    </>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </AnimateHeight>
    </article>
  );
}
