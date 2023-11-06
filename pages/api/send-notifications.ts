/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import duration from 'dayjs/plugin/duration';
import localeData from 'dayjs/plugin/localeData';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { NwsHelper } from 'helpers/api/nws/nws-helper';
import { DescriptionItem, NwsAlert } from 'models/api/alerts.model';
import { APIRoute, getPath } from 'models/api/api-route.model';
import { NotifyRequest } from 'models/api/notify.model';
import { AlertSeverity, AlertStatus } from 'models/nws/alerts.model';
import { PushSubscription } from 'web-push';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

dayjs.extend(advancedFormat);
dayjs.extend(duration);
dayjs.extend(localeData);
dayjs.extend(timezone);
dayjs.extend(utc);

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

async function notify(
  domain: string,
  subscription: SubscriptionInfo,
  alertId: NwsAlert['id'],
  alert: Pick<NwsAlert, 'severity' | 'senderName' | 'title' | 'description' | 'instruction'>,
  // city: QueriedCityInfo[DataSource.QUERIED_CITY] | undefined,
  geonameid: number,
  authHeader: string
) {
  const toStr = subscription.note ?? subscription.endpoint.slice(-6);
  let notifyResp: Response | undefined;
  try {
    const severityFName = alert.severity !== 'Unknown' ? alert.severity : 'Minor';
    const notifyRequest: NotifyRequest = {
      subscription,
      title: `${alert.title} – ${geonameid}`,
      // title: city != null ? `${alert.title} – ${city.cityName}, ${city.stateCode}` : alert.title,
      notificationOptions: {
        tag: alertId,
        // body: `${
        //   new Date().getTime() / 1_000 < alert.onset
        //     ? `From ${alert.onsetLabel}${alert.onsetShortTz !== alert.endsShortTz ? ` ${alert.onsetShortTz}` : ''} to `
        //     : `Until `
        // }${alert.endsLabel} ${alert.endsShortTz}`,
        // timestamp: alert.onset,
        icon: `/icons/Alert-${severityFName}-icon.svg`,
        badge: `/icons/Alert-${severityFName}-badge.svg`
      },
      requestOptions: {
        urgency: alert.severity === AlertSeverity.SEVERE || alert.severity === AlertSeverity.EXTREME ? 'high' : 'normal'
      }
    };
    const wait = (ms = 1_000) => new Promise(resolve => setTimeout(resolve, ms));
    await wait();

    notifyResp = await fetch(`${domain}${getPath(APIRoute.NOTIFY)}`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notifyRequest)
    });
    if (notifyResp.ok) {
      return `Sent notification for ${geonameid} for alert.id: ${alertId.slice(-13)} to ${toStr} – ${
        notifyResp.status
      }`;
    }
  } catch {
    /* empty */
  }

  console.error(
    `Could not send notification for ${geonameid} for alert.id: ${alertId.slice(
      -13
    )} to ${toStr}  – ${notifyResp?.status}: ${(await notifyResp?.text())?.trim()}`
  );
}

const NWS_ALERTS_SYSTEM_CODE_REGEX = /^[A-Z]{3}$/;
const NWS_ALERTS_HEADING_REGEX = /(\w+( +\w+)*)(?=\.{3})/;
const NWS_ALERTS_BODY_REGEX = /(?<=\.{3})(.*)/m;

function mapAlertToNwsAlert(
  alert: any
): Pick<NwsAlert, 'severity' | 'senderName' | 'title' | 'description' | 'instruction'> {
  const rawDescription = alert.properties.description;

  // Split raw description on '\n\n' if present or '\n' if it has headings; otherwise, don't split
  let splitRawDescription = [rawDescription];
  if (rawDescription.includes('\n\n')) splitRawDescription = rawDescription.split('\n\n');
  else if (NWS_ALERTS_HEADING_REGEX.exec(rawDescription)) splitRawDescription = rawDescription.split('\n');

  const description = splitRawDescription
    .filter((descItemStr, idx) => !(idx === 0 && NWS_ALERTS_SYSTEM_CODE_REGEX.test(descItemStr)))
    .map((descItemStr): DescriptionItem => {
      const normDescItemStr = descItemStr.replaceAll('\n', ' ');
      const headingExecd = NWS_ALERTS_HEADING_REGEX.exec(normDescItemStr);
      const bodyExecd = NWS_ALERTS_BODY_REGEX.exec(normDescItemStr);

      const heading = headingExecd && headingExecd.length > 0 ? headingExecd[0].toUpperCase() : undefined;
      const body = bodyExecd && bodyExecd.length > 0 ? bodyExecd[0] : undefined;
      return heading != null && body != null
        ? {
            heading,
            body
          }
        : { body: normDescItemStr };
    });
  const instruction =
    alert.properties.instruction?.split('\n\n')?.map((insParagraph: string) => insParagraph.replaceAll('\n', ' ')) ??
    [];

  // const onsetDayjs = dayjs(alert.properties.onset ?? alert.properties.effective).tz(timeZone);
  // const onsetIncludeDay = !onsetDayjs.isSame(now, 'day');
  // const onsetFormatted = this.getFormatted(onsetIncludeDay, onsetDayjs);

  // const endsDayjs = dayjs(alert.properties.ends ?? alert.properties.expires).tz(timeZone);
  // const endsIncludeDay =
  //   !endsDayjs.isSame(now, 'day') && !(endsDayjs.isSame(onsetDayjs, 'day') && onsetDayjs.isAfter(now));
  // const endsFormatted = this.getFormatted(endsIncludeDay, endsDayjs);

  return {
    // onset: onsetDayjs.unix(),
    // onsetIsoTz: this.getIsoTzString(onsetDayjs),
    // onsetLabel: onsetFormatted.label,
    // onsetShortTz: onsetFormatted.shortTz,
    // ends: endsDayjs.unix(),
    // endsIsoTz: this.getIsoTzString(endsDayjs),
    // endsLabel: endsFormatted.label,
    // endsShortTz: endsFormatted.shortTz,
    severity: alert.properties.severity,
    senderName: alert.properties.senderName,
    title: alert.properties.event,
    description,
    instruction
  };
}

async function checkAlerts() {
  // TODO: get from database
  const zonesGidsMap = new Map<string, number[]>();
  zonesGidsMap.set('COZ228', [5435464]);
  zonesGidsMap.set('COZ229', [5442007]);
  zonesGidsMap.set('CAZ073', [5330736, 5370006]);
  zonesGidsMap.set('NVZ002', [5512994]);

  const response = await NwsHelper.getAlerts();

  const gidsAlertIdsMap = new Map<number, Set<string>>();

  const now = dayjs();
  const nwsAlerts: Record<
    string,
    Pick<NwsAlert, 'severity' | 'senderName' | 'title' | 'description' | 'instruction'>
  > = {};

  for (const alert of response.features as any) {
    if (
      alert.properties.status === AlertStatus.ACTUAL &&
      (!alert.properties.ends || dayjs(alert.properties.ends).isAfter(now)) &&
      dayjs(alert.properties.expires).isAfter(now)
    ) {
      for (const zone of alert.properties.geocode.UGC) {
        const gids = zonesGidsMap.get(zone);
        if (gids?.length) {
          if (!(alert.properties.id in nwsAlerts)) {
            nwsAlerts[alert.properties.id] = mapAlertToNwsAlert(alert);
          }
          for (const gid of gids) {
            const alertIdsForGid = gidsAlertIdsMap.get(gid) ?? new Set<string>();
            alertIdsForGid.add(alert.properties.id);
            gidsAlertIdsMap.set(gid, alertIdsForGid);
          }
        }
      }
    }
  }

  return {
    gidsAlertIdsMap,
    nwsAlerts
  };
}

async function* notifications(domain: string, { subscriptions }: NotificationInfo, authHeader: string) {
  const { gidsAlertIdsMap, nwsAlerts } = await checkAlerts();
  yield prefixWithTime(`Fetched, filtered, and processed ${Object.keys(nwsAlerts).length} alerts`);

  const gidsSubIdxsMap = new Map<number, number[]>();
  for (let i = 0; i < subscriptions.length; i++) {
    for (const gid of subscriptions[i].cities) {
      if (gidsAlertIdsMap.has(gid)) {
        if (!gidsSubIdxsMap.has(gid)) gidsSubIdxsMap.set(gid, []);
        gidsSubIdxsMap.get(gid)!.push(i);
      }
    }
  }

  for (const [gid, alertIds] of gidsAlertIdsMap) {
    const subIdxs = gidsSubIdxsMap.get(gid)!;
    console.info(`${alertIds.size} alerts & ${subIdxs.length} subscriptions for ${gid}`);

    for (const alertId of alertIds) {
      const notifyMap = new Map<number, Promise<[number, string | undefined]>>(
        subIdxs.map(idx => [
          idx,
          notify(domain, subscriptions[idx], alertId, nwsAlerts[alertId], gid, authHeader).then(res => [idx, res])
        ])
      );
      while (notifyMap.size) {
        const [idx, result] = await Promise.race(notifyMap.values());
        if (result != null) yield prefixWithTime(result);
        notifyMap.delete(idx);
      }
    }
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
