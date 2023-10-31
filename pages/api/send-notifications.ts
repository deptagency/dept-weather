import { NextApiRequest, NextApiResponse } from 'next';
import { API_GEONAMEID_KEY } from 'constants/shared';
import { CitiesReqQueryHelper } from 'helpers/api/cities-req-query-helper';
import { LoggerHelper } from 'helpers/api/logger-helper';
import { NwsHelper } from 'helpers/api/nws/nws-helper';
import { NwsMapHelper } from 'helpers/api/nws/nws-map-helper';
import { APIRoute, getPath } from 'models/api/api-route.model';
import { AlertSeverity } from 'models/nws/alerts.model';
import { PushSubscription, sendNotification, setVapidDetails } from 'web-push';

setVapidDetails(
  `mailto:${process.env.WEB_PUSH_EMAIL}`,
  process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY!,
  process.env.WEB_PUSH_PRIVATE_KEY!
);

export interface AlertNotification {
  title: string;
  body: string;
  severity: AlertSeverity;
}

const LOGGER_LABEL = getPath(APIRoute.SEND_NOTIFICATIONS);
export default async function sendNotifications(_: NextApiRequest, res: NextApiResponse) {
  try {
    const subscriptions: PushSubscription[] = JSON.parse(process.env.PRIVATE_SUBSCRIPTIONS!);

    const getFormattedDuration = LoggerHelper.trackPerformance();
    const { minimalQueriedCity } = await CitiesReqQueryHelper.parseQueriedCity(
      { [API_GEONAMEID_KEY]: process.env.PRIVATE_SUBSCRIPTION_GEONAMEID! },
      getFormattedDuration
    );
    const response = await NwsHelper.getAlerts(minimalQueriedCity);
    const alerts = NwsMapHelper.mapAlertsToNwsAlerts(response, minimalQueriedCity.timeZone);

    if (alerts.alerts.length === 0) {
      res.status(204).end();
      return;
    }

    const notificationResStatusCodes = new Set<number>();
    for (const alert of alerts.alerts) {
      const showOnset = new Date().getTime() / 1_000 < alert.onset;
      const bodyPrefix = showOnset
        ? `From ${alert.onsetLabel}${alert.onsetShortTz !== alert.endsShortTz ? ` ${alert.onsetShortTz}` : ''} to `
        : `Until `;
      const body = `${bodyPrefix}${alert.endsLabel} ${alert.endsShortTz}`;

      LoggerHelper.getLogger(LOGGER_LABEL).info(`Sending notifications for alert.id: ${alert.id}`);
      console.log(subscriptions);
      for (const subscription of subscriptions) {
        const notificationRes = await sendNotification(
          subscription,
          JSON.stringify({
            title: alert.title,
            body,
            severity: alert.severity,
            id: alert.id,
            onset: alert.onset
          }),
          {
            urgency:
              alert.severity === AlertSeverity.SEVERE || alert.severity === AlertSeverity.EXTREME ? 'high' : 'normal'
          }
        );
        notificationResStatusCodes.add(notificationRes.statusCode);
      }
    }

    res
      .status(Math.max(...notificationResStatusCodes.values()))
      .json({ statusCodes: [...notificationResStatusCodes.values()] });
  } catch (err: any) {
    LoggerHelper.getLogger(LOGGER_LABEL).error('Failed');
    if ('statusCode' in err) {
      res.writeHead(err.statusCode, err.headers).end(err.body);
    } else {
      console.error(err);
      res.status(500).end();
    }
  }
}
