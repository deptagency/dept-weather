import { PushSubscription, RequestOptions } from 'web-push';

export interface NotifyRequest {
  subscription: PushSubscription;
  title: string;
  notificationOptions: NotificationOptions | undefined;
  requestOptions: RequestOptions;
}
