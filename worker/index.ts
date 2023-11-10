/* eslint-disable no-console */
import { ServiceWorkerGlobalScope, WindowClient } from 'models/service-worker.model';

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

const getQueryParamsFromUrl = (url: string) => {
  let queryParams: Record<string, string> = {};

  const idxOfQuery = url.indexOf('?');
  const idxOfFragment = url.indexOf('#');
  if (idxOfQuery > -1) {
    const fullQueryStr = url.slice(idxOfQuery + 1, idxOfFragment > idxOfQuery + 1 ? idxOfFragment : undefined);
    const queryStrs = fullQueryStr.split('&').filter(q => q.indexOf('=') > 0 && q.indexOf('=') < q.length);
    queryParams = Object.fromEntries(queryStrs.map(qStr => qStr.split('=')));
  }

  return queryParams;
};

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
  event.waitUntil(
    // self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clientListIn => {
    // Sort so the focused clients are first
    // const clientList = (clientListIn as unknown as WindowClient[]).sort((a, b) => Number(b.focused) - Number(a.focused));

    // Preference: focused open client for city > open client for city > open client
    // let clientToFocus = clientList.find(client => getQueryParamsFromUrl(client.url)['id'] === geonameid);
    // if (clientToFocus == null && clientList.length > 0) clientToFocus = clientList[0];
    // if (clientToFocus != null) {
    //   // Open preferred existing window
    //   return clientToFocus!.focus().then(() => clientToFocus!.navigate(href));
    // }

    // Open new window
    self.clients.openWindow(href)
    // })
  );
});

self.addEventListener('notificationclose', event => {
  event.notification.close();
});
