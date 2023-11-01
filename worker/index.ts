import { ServiceWorkerGlobalScope } from 'models/service-worker.model';

declare let self: ServiceWorkerGlobalScope;

// To disable all workbox logging during development, you can set self.__WB_DISABLE_DEV_LOGS to true
// https://developers.google.com/web/tools/workbox/guides/configure-workbox#disable_logging
//
// self.__WB_DISABLE_DEV_LOGS = true

// listen to message event from window
// self.addEventListener('message', event => {
//   // HOW TO TEST THIS?
//   // Run this in your browser console:
//   //     window.navigator.serviceWorker.controller.postMessage({command: 'log', message: 'hello world'})
//   // OR use next-pwa injected workbox object
//   //     window.workbox.messageSW({command: 'log', message: 'hello world'})
//   console.log(event?.data);
// });

self.addEventListener('push', event => {
  console.log('ON PUSH!');
  const data = JSON.parse(event?.data.text() || '{}');
  const alertCacheName = `alert:${data.id}`;
  event?.waitUntil(
    caches
      .has(alertCacheName)
      .then(async hasAlertCacheName => {
        if (!hasAlertCacheName) {
          const severityFName = data.severity !== 'Unknown' ? data.severity : 'Minor';
          await self.registration.showNotification(
            `${data.title} for ${data.forCity.cityName}, ${data.forCity.stateCode}`,
            {
              tag: data.id,
              body: data.body,
              icon: `/icons/Alert-${severityFName}-icon.svg`,
              badge: `/icons/Alert-${severityFName}-badge.svg`,
              timestamp: data.onset
              // TODO - set vibrate
            }
          );
          await caches.open(alertCacheName);
        }
      })
      .then(async () => {
        const currentNotifications = await self.registration.getNotifications();
        navigator.setAppBadge(currentNotifications.length);
      })
  );
});

self.addEventListener('notificationclick', event => {
  event?.notification.close();
  event?.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // TODO - navigate to correct city and expand alert
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return self.clients.openWindow('/');
      })
      .then(async () => {
        const currentNotifications = await self.registration.getNotifications();
        navigator.setAppBadge(currentNotifications.length);
      })
  );
});

self.addEventListener('notificationclose', event => {
  event?.notification.close();
  event?.waitUntil(
    self.registration
      .getNotifications()
      .then(async currentNotifications => navigator.setAppBadge(currentNotifications.length))
  );
});
