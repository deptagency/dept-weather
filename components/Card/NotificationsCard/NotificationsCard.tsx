import { useEffect, useState } from 'react';
import { CardHeader } from 'components/Card/CardHeader/CardHeader';
import { APIRoute, getPath } from 'models/api/api-route.model';
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

export function NotificationsCard() {
  const [permissionState, setPermissionState] = useState<PermissionState>();

  const [isSubscribed, setIsSubscribed] = useState<boolean>();
  const [subscription, setSubscription] = useState<PushSubscription>();
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();

  useEffect(() => {
    (async () => {
      if (typeof window !== 'undefined') {
        if ('permissions' in navigator) {
          const permissionStatus = await navigator.permissions.query({ name: 'notifications' });
          setPermissionState(permissionStatus.state);
        }

        if ('serviceWorker' in navigator && 'workbox' in window && window.workbox !== undefined) {
          // run only in browser
          navigator.serviceWorker.ready.then(reg => {
            reg.pushManager.getSubscription().then(sub => {
              if (sub && !(sub.expirationTime && Date.now() > sub.expirationTime - 5 * 60 * 1000)) {
                setSubscription(sub);
                setIsSubscribed(true);
              }
            });
            setRegistration(reg);
          });
        }
      }
    })();
  }, []);

  const [isRequestingSend, setIsRequestingSend] = useState<boolean>(false);

  return (
    <article className={baseStyles.card}>
      <CardHeader
        backgroundColor={Color.ONYX}
        contents={
          <div className={cardHeaderStyles['card-header__contents']}>
            <h2 className={cardHeaderStyles['card-header__contents__title']}>Notifications</h2>
          </div>
        }
      />
      <div className={styles['notifications-card-content']}>
        <div className={styles['status-grid']}>
          <p>Permission:</p>
          <h4>{(permissionState ?? '').toUpperCase()}</h4>
          <p>isSubscribed?</p>
          <h4>{isSubscribed ? 'YES' : 'NO'}</h4>
        </div>

        <p>Subscription Details</p>
        <textarea disabled={!subscription} readOnly value={subscription ? JSON.stringify(subscription.toJSON()) : ''} />

        <button
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
        </button>

        <button
          disabled={!isSubscribed || subscription == null || isRequestingSend}
          onClick={async () => {
            try {
              setIsRequestingSend(true);
              await fetch(getPath(APIRoute.SEND_NOTIFICATIONS), {
                method: 'POST'
              });
            } catch (err) {
              console.error(err);
            }

            setIsRequestingSend(false);
          }}
          type="button"
        >
          {isRequestingSend ? 'Sending...' : 'Send Notification'}
        </button>
      </div>
    </article>
  );
}
