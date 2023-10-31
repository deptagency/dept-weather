import { NextApiRequest, NextApiResponse } from 'next';
import { sendNotification } from 'web-push';

export default async function notification(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'POST') {
    const { subscription } = req.body;

    try {
      const notificationRes = await sendNotification(
        subscription,
        JSON.stringify({ title: 'Hello Web Push', message: 'Your web push notification is here!' }),
        {
          vapidDetails: {
            subject: `mailto:${process.env.WEB_PUSH_EMAIL}`,
            publicKey: process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY!,
            privateKey: process.env.WEB_PUSH_PRIVATE_KEY!
          }
        }
      );
      res.writeHead(notificationRes.statusCode, notificationRes.headers).end(notificationRes.body);
      //
    } catch (err: any) {
      if ('statusCode' in err) {
        res.writeHead(err.statusCode, err.headers).end(err.body);
      } else {
        console.error(err);
        res.statusCode = 500;
        res.end();
      }
    }
  } else {
    res.statusCode = 405;
    res.end();
  }
}
