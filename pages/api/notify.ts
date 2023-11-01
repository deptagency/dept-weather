import { NextApiRequest, NextApiResponse } from 'next';
import { LoggerHelper } from 'helpers/api/logger-helper';
import { APIRoute, getPath } from 'models/api/api-route.model';
import { NotifyRequest } from 'models/api/notify.model';
import { sendNotification } from 'web-push';

const LOGGER_LABEL = getPath(APIRoute.NOTIFY);
export default async function notify(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      if (
        req.headers.authorization !== `Bearer ${process.env.NOTIFICATIONS_SECRET}` &&
        req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`
      ) {
        res.status(401).end();
        return;
      }

      const { subscription, title, notificationOptions, requestOptions }: NotifyRequest = req.body;
      LoggerHelper.getLogger(LOGGER_LABEL).info(
        `Sending notification for tag: ${notificationOptions?.tag} to ${subscription.endpoint.slice(-6)}...`
      );

      const sendResult = await sendNotification(subscription, JSON.stringify({ title, options: notificationOptions }), {
        ...requestOptions,
        vapidDetails: {
          subject: `mailto:${process.env.WEB_PUSH_EMAIL}`,
          publicKey: process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY!,
          privateKey: process.env.WEB_PUSH_PRIVATE_KEY!
        }
      });
      res.writeHead(sendResult.statusCode, sendResult.headers).end(sendResult.body);
    } catch (err: any) {
      if ('statusCode' in err) {
        res.writeHead(err.statusCode, err.headers).end(err.body);
      } else {
        console.error(err);
        res.status(500).end();
      }
    }
  } else {
    res.status(405).end();
  }
}
