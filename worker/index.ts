/* eslint-disable no-console */
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
//   console.log(event.data);
// });

self.addEventListener('push', event => {
  // https://developer.apple.com/documentation/usernotifications/sending_web_push_notifications_in_safari_and_other_browsers
  // >> Safari doesn’t support invisible push notifications.
  // >> Present push notifications to the user immediately after your service worker receives them.
  // >> If you don’t, Safari revokes the push notification permission for your site.
  const data = event.data.json() ?? {};
  event.waitUntil(self.registration.showNotification(data.title, data.options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const [geonameid, alertId] = event.notification.tag.split('-');
  const href = `/?id=${geonameid}&alertId=${encodeURIComponent(alertId)}`;
  event.waitUntil(self.clients.openWindow(href));
});

self.addEventListener('notificationclose', event => {
  event.notification.close();
});
