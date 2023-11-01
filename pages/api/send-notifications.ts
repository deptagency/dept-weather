import { NextRequest } from 'next/server';
import { API_GEONAMEID_KEY } from 'constants/shared';
import { Alerts, NwsAlert } from 'models/api/alerts.model';
import { APIRoute, getPath } from 'models/api/api-route.model';
import { NotifyRequest } from 'models/api/notify.model';
import { Response as ResponseModel } from 'models/api/response.model';
import { City } from 'models/cities/cities.model';
import { AlertSeverity } from 'models/nws/alerts.model';
import { PushSubscription } from 'web-push';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface SubscriptionInfo extends PushSubscription {
  cities: string[];
}

interface NotificationInfo {
  subscriptions: SubscriptionInfo[];
  cities: City[];
}

interface AlertsForCity {
  city: City;
  alerts: NwsAlert[];
}

async function getAlertsForCity(domain: string, city: City) {
  let alerts: NwsAlert[] = [];

  try {
    const alertsResp: ResponseModel<Alerts> = await (
      await fetch(`${domain}${getPath(APIRoute.ALERTS, { [API_GEONAMEID_KEY]: city.geonameid })}`)
    ).json();
    alerts = alertsResp?.data?.nws?.alerts ?? [];
  } catch (err) {
    console.error(`Could not get alerts for ${city.geonameid} / ${city.cityName}, ${city.stateCode}`, err);
  }

  return { alerts, city };
}

async function notify(domain: string, subscription: SubscriptionInfo, city: City, alert: NwsAlert, authHeader: string) {
  let notifyResp: Response | undefined;
  try {
    const severityFName = alert.severity !== 'Unknown' ? alert.severity : 'Minor';
    const notifyRequest: NotifyRequest = {
      subscription,
      title: `${alert.title} for ${city.cityName}, ${city.stateCode}`,
      notificationOptions: {
        tag: alert.id,
        body: `${
          new Date().getTime() / 1_000 < alert.onset
            ? `From ${alert.onsetLabel}${alert.onsetShortTz !== alert.endsShortTz ? ` ${alert.onsetShortTz}` : ''} to `
            : `Until `
        }${alert.endsLabel} ${alert.endsShortTz}`,
        timestamp: alert.onset,
        icon: `/icons/Alert-${severityFName}-icon.svg`,
        badge: `/icons/Alert-${severityFName}-badge.svg`
      },
      requestOptions: {
        urgency: alert.severity === AlertSeverity.SEVERE || alert.severity === AlertSeverity.EXTREME ? 'high' : 'normal'
      }
    };
    notifyResp = await fetch(`${domain}${getPath(APIRoute.NOTIFY)}`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notifyRequest)
    });
    if (notifyResp.ok) {
      return `Sent notification for alert.id: ${alert.id.slice(-13)} to ${subscription.endpoint.slice(-6)} – ${
        notifyResp.status
      }`;
    }
  } catch {
    /* empty */
  }

  console.error(
    `Could not send notification for alert.id: ${alert.id.slice(-13)} to ${subscription.endpoint.slice(
      -6
    )}  – ${notifyResp?.status}: ${(await notifyResp?.text())?.trim()}`
  );
}

async function* notifications(domain: string, { cities, subscriptions }: NotificationInfo, authHeader: string) {
  const alertsForCityMap = new Map<string, Promise<[string, AlertsForCity]>>(
    cities.map(city => [city.geonameid, getAlertsForCity(domain, city).then(res => [city.geonameid, res])])
  );
  while (alertsForCityMap.size) {
    const [key, result] = await Promise.race(alertsForCityMap.values());

    if (result.alerts.length) {
      const subscribedSubs = subscriptions.filter(subscription => subscription.cities.includes(result.city.geonameid));
      console.info(
        `${result.alerts.length} alerts & ${subscribedSubs.length} subscriptions for "${result.city.cityName}, ${result.city.stateCode}" / ${result.city.geonameid}`
      );
      if (subscribedSubs.length) {
        for (const alert of result.alerts) {
          const notifyMap = new Map<string, Promise<[string, string | undefined]>>(
            subscribedSubs.map(subscription => [
              subscription.endpoint.slice(-6),
              notify(domain, subscription, result.city, alert, authHeader).then(res => [
                subscription.endpoint.slice(-6),
                res
              ])
            ])
          );
          while (notifyMap.size) {
            const [key, result] = await Promise.race(notifyMap.values());
            if (result != null) yield result;
            notifyMap.delete(key);
          }
        }
      }
    }

    alertsForCityMap.delete(key);
  }
}

async function sendNotifications(domain: string, notificationInfo: NotificationInfo, authHeader: string) {
  const iterator = notifications(domain, notificationInfo, authHeader);
  const stream = new ReadableStream({
    // pull() fires when data added to stream
    async pull(controller) {
      const { value, done } = await iterator.next();
      done ? controller.close() : controller.enqueue(value);
    }
  });
  const reader = stream.getReader();
  let readResult = await reader.read();
  while (!readResult.done) {
    console.log(readResult.value);
    readResult = await reader.read();
  }
  console.info('Finished sending notifications');
}

export default async function GET(req: NextRequest) {
  let authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET) authHeader = `Bearer ${process.env.CRON_SECRET}`;
  else if (authHeader !== `Bearer ${process.env.NOTIFICATIONS_SECRET}`) {
    return new Response(undefined, {
      status: 401
    });
  }

  const notificationInfo = (await (
    await fetch(`${process.env.NOTIFICATIONS_INFO_URL!}?cache-bust=${new Date().getTime() / 1_000}`)
  ).json()) as NotificationInfo;
  console.info(
    `Retrieved info for ${notificationInfo.subscriptions.length} subscriptions, ${notificationInfo.cities.length} cities`
  );

  const domain = req.url.slice(0, req.url.indexOf(getPath(APIRoute.SEND_NOTIFICATIONS)));
  sendNotifications(domain, notificationInfo, authHeader);

  return new Response(undefined, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
