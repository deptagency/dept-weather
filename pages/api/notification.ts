import { NextApiRequest, NextApiResponse } from 'next';
import { LoggerHelper } from 'helpers/api/logger-helper';
import { APIRoute, getPath } from 'models/api/api-route.model';
import { sendNotification, setVapidDetails } from 'web-push';

setVapidDetails(
  `mailto:${process.env.WEB_PUSH_EMAIL}`,
  process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY!,
  process.env.WEB_PUSH_PRIVATE_KEY!
);

const LOGGER_LABEL = getPath(APIRoute.NOTIFICATION);
export default async function notification(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'POST') {
    const { subscription } = req.body;
    try {
      LoggerHelper.getLogger(LOGGER_LABEL).info(`Calling sendNotification() for endpoint: ${subscription.endpoint}`);
      const notificationRes = await sendNotification(
        subscription,
        JSON.stringify({ title: 'Hello Web Push', message: 'Your web push notification is here!' })
      );

      for (const headerName in notificationRes.headers) {
        res.setHeader(headerName, notificationRes.headers[headerName]);
      }
      res.status(notificationRes.statusCode).send(notificationRes.body);
    } catch (err: any) {
      LoggerHelper.getLogger(LOGGER_LABEL).error('Failed');
      if ('statusCode' in err) {
        res.writeHead(err.statusCode, err.headers).end(err.body);
      } else {
        console.error(err);
        res.statusCode = 500;
        res.end();
      }
    }
  } else {
    LoggerHelper.getLogger(LOGGER_LABEL).info(`Method "${req.method}" not allowed!`);
    res.status(405).end();
  }
}
