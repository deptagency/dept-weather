import { NextRequest, NextResponse } from 'next/server';
import { API_GEONAMEID_KEY } from 'constants/shared';
import { Alerts, NwsAlert } from 'models/api/alerts.model';
import { APIRoute, getPath } from 'models/api/api-route.model';
import { NotifyRequest } from 'models/api/notify.model';
import { QueriedCityInfo } from 'models/api/queried-location-info.model';
import { Response as ResponseModel } from 'models/api/response.model';
import { DataSource } from 'models/data-source.enum';
import { AlertSeverity } from 'models/nws/alerts.model';
import { PushSubscription } from 'web-push';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface SubscriptionInfo extends PushSubscription {
  note?: string;
  cities: number[];
}

interface NotificationInfo {
  subscriptions: SubscriptionInfo[];
}

function prefixWithTime(str: string) {
  const now = new Date();
  return `${now.toTimeString().slice(0, 8)}.${String(now.getMilliseconds()).padStart(3, '0')} ${str}`;
}

async function getAlerts(domain: string, gid: number): Promise<Partial<Alerts> | undefined> {
  let alertsResp: ResponseModel<Alerts> | undefined;

  try {
    alertsResp = await (await fetch(`${domain}${getPath(APIRoute.ALERTS, { [API_GEONAMEID_KEY]: gid })}`)).json();
  } catch (err) {
    console.error(`Could not get alerts for ${gid}`, err);
    if (alertsResp?.errors?.length) console.error(`Returned errors:`, alertsResp.errors);
    if (alertsResp?.errors?.length) console.error(`Returned warnings:`, alertsResp.warnings);
  }

  return alertsResp?.data;
}

async function notify(
  domain: string,
  subscription: SubscriptionInfo,
  alert: NwsAlert,
  city: QueriedCityInfo[DataSource.QUERIED_CITY] | undefined,
  authHeader: string
) {
  const toStr = subscription.note ?? subscription.endpoint.slice(-6);
  let notifyResp: Response | undefined;
  try {
    const severityFName = alert.severity !== 'Unknown' ? alert.severity : 'Minor';
    const notifyRequest: NotifyRequest = {
      subscription,
      title: city != null ? `${alert.title} – ${city.cityName}, ${city.stateCode}` : alert.title,
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
      return `Sent notification for alert.id: ${alert.id.slice(-13)} to ${toStr} – ${notifyResp.status}`;
    }
  } catch {
    /* empty */
  }

  console.error(
    `Could not send notification for alert.id: ${alert.id.slice(-13)} to ${toStr}  – ${notifyResp?.status}: ${(
      await notifyResp?.text()
    )?.trim()}`
  );
}

async function* notifications(domain: string, { subscriptions }: NotificationInfo, authHeader: string) {
  const subscriptionsForGids = new Map<number, number[]>();
  for (let i = 0; i < subscriptions.length; i++) {
    for (const gid of subscriptions[i].cities) {
      const prevVal = subscriptionsForGids.get(gid) ?? [];
      subscriptionsForGids.set(gid, [...prevVal, i]);
    }
  }
  console.log('subscriptionsForGids:', subscriptionsForGids);
  const alertsForCityMap = new Map<number, Promise<[number, Partial<Alerts> | undefined]>>(
    Array.from(subscriptionsForGids.keys()).map(gid => [gid, getAlerts(domain, gid).then(res => [gid, res])])
  );
  while (alertsForCityMap.size) {
    const [gid, result] = await Promise.race(alertsForCityMap.values());

    if (result?.nws?.alerts?.length) {
      const subIdxs = subscriptionsForGids.get(gid)!;
      console.info(`${result.nws.alerts.length} alerts & ${subIdxs.length} subscriptions for ${gid}`);
      for (const alert of result.nws.alerts) {
        const notifyMap = new Map<number, Promise<[number, string | undefined]>>(
          subIdxs.map(idx => [
            idx,
            notify(domain, subscriptions[idx], alert, result.queriedCity, authHeader).then(res => [idx, res])
          ])
        );
        while (notifyMap.size) {
          const [idx, result] = await Promise.race(notifyMap.values());
          if (result != null) yield prefixWithTime(result);
          notifyMap.delete(idx);
        }
      }
    }

    alertsForCityMap.delete(gid);
  }

  yield prefixWithTime('Finished!');
}

export default async function GET(req: NextRequest) {
  let authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET) authHeader = `Bearer ${process.env.CRON_SECRET}`;
  else if (authHeader !== `Bearer ${process.env.NOTIFICATIONS_SECRET}`) {
    return new NextResponse(undefined, {
      status: 401
    });
  }

  const notificationInfo = (await (
    await fetch(`${process.env.NOTIFICATIONS_INFO_URL!}?cache-bust=${new Date().getTime() / 1_000}`)
  ).json()) as NotificationInfo;
  console.info(`Retrieved info for ${notificationInfo.subscriptions.length} subscriptions`);

  const domain = req.url.slice(0, req.url.indexOf(getPath(APIRoute.SEND_NOTIFICATIONS)));
  const iterator = notifications(domain, notificationInfo, authHeader);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(prefixWithTime('Starting...\n')));
    },
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        console.log(value);
        controller.enqueue(encoder.encode(`${value}\n`));
      }
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
